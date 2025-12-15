import { Injectable, UnauthorizedException, ConflictException, ForbiddenException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AUTH_MESSAGES } from '../common/constants/messages.constant';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(email: string, pass: string): Promise<Omit<any, 'passwordHash'> | null> {
    const user = await this.usersService.findOne(email);
    if (user && (await bcrypt.compare(pass, user.passwordHash))) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash, ...result } = user;
      return result;
    }
    return null;
  }

  async getTokens(userId: number, username: string, roles: string[]) {
    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(
        {
          sub: userId,
          username,
          roles,
        },
        {
          secret: this.configService.get<string>('JWT_SECRET'),
          expiresIn: '15m',
        },
      ),
      this.jwtService.signAsync(
        {
          sub: userId,
          username,
          roles,
        },
        {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
          expiresIn: '7d',
        },
      ),
    ]);

    return {
      access_token,
      refresh_token,
    };
  }

  async updateRefreshToken(userId: number, refreshToken: string) {
    const salt = await bcrypt.genSalt();
    const hashedRefreshToken = await bcrypt.hash(refreshToken, salt);
    await this.usersService.update(userId, {
      hashedRefreshToken,
    });
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException(AUTH_MESSAGES.INVALID_CREDENTIALS);
    }
    
    const roles = user.userRoles?.map((ur) => ur.role.name) || [];
    const tokens = await this.getTokens(user.id, user.email, roles);
    await this.updateRefreshToken(user.id, tokens.refresh_token);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        roles
      }
    };
  }

  async logout(userId: number) {
    await this.usersService.update(userId, { hashedRefreshToken: null });
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
      
      const userId = payload.sub;
      const user = await this.usersService.findOneById(userId);
      if (!user || !user.hashedRefreshToken)
        throw new ForbiddenException(AUTH_MESSAGES.ACCESS_DENIED);

      const refreshTokenMatches = await bcrypt.compare(
        refreshToken,
        user.hashedRefreshToken,
      );
      if (!refreshTokenMatches) throw new ForbiddenException(AUTH_MESSAGES.ACCESS_DENIED);

      const roles = (user as any).userRoles?.map((ur) => ur.role.name) || [];
      const tokens = await this.getTokens(user.id, user.email, roles);
      await this.updateRefreshToken(user.id, tokens.refresh_token);
      return tokens;
    } catch (e) {
      console.error(e);
      throw new ForbiddenException(AUTH_MESSAGES.INVALID_REFRESH_TOKEN);
    }
  }

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersService.findOne(registerDto.email);
    if (existingUser) {
      throw new ConflictException(AUTH_MESSAGES.EMAIL_EXISTS);
    }

    const { password, ...userData } = registerDto;
    
    // Create user with hashed password (hashing is handled in UsersService)
    // We pass the raw password as 'passwordHash' because UsersService expects Prisma.UserCreateInput
    // but inside UsersService.create we re-hash it. 
    // Wait, UsersService.create expects Prisma.UserCreateInput which has passwordHash.
    // Let's adjust UsersService logic or pass it correctly here.
    // In UsersService I wrote: const passwordHash = await bcrypt.hash(data.passwordHash, salt);
    // So I should pass the raw password into the passwordHash field for now, knowing it will be hashed.
    
    const newUser = await this.usersService.create({
      email: userData.email,
      passwordHash: password, // Will be hashed in service
      username: userData.username,
      phone: userData.phone,
    });

    return this.login({ email: newUser.email, password: password });
  }
}
