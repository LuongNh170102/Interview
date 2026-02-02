import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AUTH_MESSAGES } from '../common/constants/messages.constant';
import { JWT_CONSTANTS } from '../common/constants/token.constant';
import { PrismaService } from '../prisma.service';
import {
  LinkGoogleAccountDto,
  GoogleAuthResponse,
} from './dto/google-auth.dto';
import { AuthProvider, User, UserRole, Role } from '@prisma/client';
import { GoogleProfile } from '../common/interfaces/auth.interface';
import { UserEntity } from '../users/entities/user.entity';
import { plainToInstance } from 'class-transformer';

// Type for user with roles included
type UserWithRoles = User & {
  userRoles?: (UserRole & { role: Role })[];
};

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private prisma: PrismaService
  ) {}

  async validateUser(
    email: string,
    pass: string
  ): Promise<Omit<UserWithRoles, 'passwordHash'> | null> {
    const user = await this.usersService.findOne(email);
    if (!user) {
      return null;
    }

    // Check if user has a password (users created via OAuth may not have one)
    if (!user.passwordHash) {
      return null;
    }

    if (await bcrypt.compare(pass, user.passwordHash)) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash, ...result } = user;
      return result;
    }
    return null;
  }

  async getTokens(userId: number, username: string, roles: string[]) {
    const accessExpiresIn = this.configService.get<string>(
      JWT_CONSTANTS.EXPIRATION
    );
    const refreshExpiresIn = this.configService.get<string>(
      JWT_CONSTANTS.REFRESH_EXPIRATION
    );

    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(
        {
          sub: userId,
          username,
          roles,
        },
        {
          secret: this.configService.get<string>(JWT_CONSTANTS.SECRET),
          expiresIn: accessExpiresIn,
        } as JwtSignOptions
      ),
      this.jwtService.signAsync(
        {
          sub: userId,
          username,
          roles,
        },
        {
          secret: this.configService.get<string>(JWT_CONSTANTS.REFRESH_SECRET),
          expiresIn: refreshExpiresIn,
        } as JwtSignOptions
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
    // First check if user exists
    const existingUser = await this.usersService.findOne(loginDto.email);

    if (existingUser && !existingUser.passwordHash) {
      // User exists but was created via OAuth without password
      // Check if they have linked accounts
      const linkedAccounts = await this.prisma.linkedAccount.findMany({
        where: { userId: existingUser.id },
        select: { provider: true },
      });

      if (linkedAccounts.length > 0) {
        const providers = linkedAccounts.map((la) => la.provider).join(', ');
        throw new UnauthorizedException(
          AUTH_MESSAGES.OAUTH_ONLY_ACCOUNT_PROVIDERS(providers)
        );
      }
    }

    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException(AUTH_MESSAGES.INVALID_CREDENTIALS);
    }

    const roles = user.userRoles?.map((ur) => ur.role.name) || [];
    const permissions = await this.usersService.getUserPermissions(user.id);
    const tokens = await this.getTokens(user.id, user.email, roles);
    await this.updateRefreshToken(user.id, tokens.refresh_token);

    const userEntity = plainToInstance(UserEntity, user, {
      excludeExtraneousValues: false,
    });

    return {
      ...tokens,
      user: {
        externalId: userEntity.externalId,
        email: userEntity.email,
        username: userEntity.username,
        avatarUrl: userEntity.avatarUrl,
        roles,
      },
      permissions,
    };
  }

  async logout(userId: number) {
    await this.usersService.update(userId, { hashedRefreshToken: null });
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>(JWT_CONSTANTS.REFRESH_SECRET),
      });

      const userId = payload.sub;
      const user = await this.usersService.findOneById(userId);
      if (!user || !user.hashedRefreshToken)
        throw new ForbiddenException(AUTH_MESSAGES.ACCESS_DENIED);

      const refreshTokenMatches = await bcrypt.compare(
        refreshToken,
        user.hashedRefreshToken
      );
      if (!refreshTokenMatches)
        throw new ForbiddenException(AUTH_MESSAGES.ACCESS_DENIED);

      const roles =
        (user as UserWithRoles).userRoles?.map((ur) => ur.role.name) || [];
      const permissions = await this.usersService.getUserPermissions(user.id);
      const tokens = await this.getTokens(user.id, user.email, roles);
      await this.updateRefreshToken(user.id, tokens.refresh_token);

      const userEntity = plainToInstance(UserEntity, user, {
        excludeExtraneousValues: false,
      });

      return {
        ...tokens,
        user: {
          externalId: userEntity.externalId,
          email: userEntity.email,
          username: userEntity.username,
          avatarUrl: userEntity.avatarUrl,
          roles,
        },
        permissions,
      };
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

  /**
   * Get user permissions - can be called from controller
   */
  async getUserPermissions(userId: number): Promise<string[]> {
    return this.usersService.getUserPermissions(userId);
  }

  // ===========================================================================
  // GOOGLE OAUTH - ACCOUNT LINKING
  // ===========================================================================

  /**
   * Handle Google OAuth callback
   * Flow:
   * 1. Check if Google account is already linked → Login directly
   * 2. Check if email exists in DB → Require password confirmation to link
   * 3. Email doesn't exist → Create new user with Google account
   */
  async handleGoogleAuth(
    googleProfile: GoogleProfile
  ): Promise<GoogleAuthResponse> {
    const { providerId, email, displayName, avatarUrl } = googleProfile;

    // 1. Check if Google account is already linked
    const existingLinkedAccount = await this.prisma.linkedAccount.findUnique({
      where: {
        provider_providerId: {
          provider: AuthProvider.GOOGLE,
          providerId,
        },
      },
      include: {
        user: {
          include: {
            userRoles: {
              include: {
                role: true,
              },
            },
          },
        },
      },
    });

    if (existingLinkedAccount) {
      // Google account already linked → Login directly
      return this.loginWithLinkedAccount(existingLinkedAccount.user);
    }

    // 2. Check if email exists in DB (user registered with email/password)
    const existingUser = await this.usersService.findOne(email);

    if (existingUser) {
      // Email exists → Require password confirmation to link
      return {
        requiresLinking: true,
        email,
        googleId: providerId,
        displayName,
        avatarUrl,
        message: AUTH_MESSAGES.GOOGLE_ACCOUNT_REQUIRES_LINKING,
      };
    }

    // 3. Email doesn't exist → Create new user with Google account
    const newUser = await this.createUserWithGoogle(googleProfile);
    return this.loginWithLinkedAccount(newUser);
  }

  /**
   * Link Google account to existing user (after password confirmation)
   */
  async linkGoogleAccount(
    dto: LinkGoogleAccountDto
  ): Promise<GoogleAuthResponse> {
    const {
      email,
      password,
      googleId,
      displayName,
      avatarUrl,
      accessToken,
      refreshToken,
    } = dto;

    // Validate user credentials
    const user = await this.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException(AUTH_MESSAGES.INVALID_CREDENTIALS);
    }

    // Check if this Google ID is already linked to another account
    const existingLink = await this.prisma.linkedAccount.findUnique({
      where: {
        provider_providerId: {
          provider: AuthProvider.GOOGLE,
          providerId: googleId,
        },
      },
    });

    if (existingLink) {
      throw new ConflictException(AUTH_MESSAGES.GOOGLE_ALREADY_LINKED_OTHER);
    }

    // Check if user already has a Google account linked
    const userGoogleLink = await this.prisma.linkedAccount.findUnique({
      where: {
        userId_provider: {
          userId: user.id,
          provider: AuthProvider.GOOGLE,
        },
      },
    });

    if (userGoogleLink) {
      throw new ConflictException(AUTH_MESSAGES.USER_ALREADY_HAS_GOOGLE);
    }

    // Create linked account
    await this.prisma.linkedAccount.create({
      data: {
        userId: user.id,
        provider: AuthProvider.GOOGLE,
        providerId: googleId,
        email,
        displayName,
        avatarUrl,
        accessToken,
        refreshToken,
      },
    });

    // Update user avatar if not set
    if (!user.avatarUrl && avatarUrl) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { avatarUrl },
      });
    }

    // Return login response
    const fullUser = await this.usersService.findOneById(user.id);
    return this.loginWithLinkedAccount(fullUser);
  }

  /**
   * Create new user from Google profile
   */
  private async createUserWithGoogle(
    profile: GoogleProfile
  ): Promise<UserWithRoles> {
    const {
      email,
      displayName,
      avatarUrl,
      providerId,
      accessToken,
      refreshToken,
    } = profile;

    // Create user without password (OAuth-only user)
    const user = await this.prisma.user.create({
      data: {
        email,
        username: displayName || email.split('@')[0],
        passwordHash: null, // No password for OAuth-only users
        avatarUrl,
        linkedAccounts: {
          create: {
            provider: AuthProvider.GOOGLE,
            providerId,
            email,
            displayName,
            avatarUrl,
            accessToken,
            refreshToken,
          },
        },
      },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    return user;
  }

  /**
   * Login user with linked OAuth account
   */
  private async loginWithLinkedAccount(
    user: UserWithRoles | null
  ): Promise<GoogleAuthResponse> {
    if (!user) {
      throw new UnauthorizedException(AUTH_MESSAGES.INVALID_CREDENTIALS);
    }
    const roles = user.userRoles?.map((ur) => ur.role.name) || [];
    const permissions = await this.usersService.getUserPermissions(user.id);
    const tokens = await this.getTokens(user.id, user.email, roles);
    await this.updateRefreshToken(user.id, tokens.refresh_token);

    const userEntity = plainToInstance(UserEntity, user, {
      excludeExtraneousValues: false,
    });

    return {
      requiresLinking: false,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      user: {
        externalId: userEntity.externalId,
        email: userEntity.email,
        username: userEntity.username,
        avatarUrl: userEntity.avatarUrl,
        roles,
      },
      permissions,
    };
  }

  /**
   * Unlink Google account from user
   */
  async unlinkGoogleAccount(userId: number): Promise<void> {
    // Check if user has password set (can't unlink if no other auth method)
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });

    if (!user?.passwordHash) {
      throw new BadRequestException(AUTH_MESSAGES.CANNOT_UNLINK_ONLY_AUTH);
    }

    await this.prisma.linkedAccount.deleteMany({
      where: {
        userId,
        provider: AuthProvider.GOOGLE,
      },
    });
  }

  /**
   * Get user's linked accounts
   */
  async getLinkedAccounts(userId: number) {
    return this.prisma.linkedAccount.findMany({
      where: { userId },
      select: {
        id: true,
        provider: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        createdAt: true,
      },
    });
  }

  /**
   * Set password for OAuth-only user
   * Allows OAuth users to also login with email/password
   */
  async setPassword(userId: number, password: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });

    if (user?.passwordHash) {
      throw new BadRequestException(AUTH_MESSAGES.PASSWORD_ALREADY_SET);
    }

    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(password, salt);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }

  /**
   * Check if user has password set
   */
  async hasPassword(userId: number): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });
    return !!user?.passwordHash;
  }

  /**
   * Get user profile with externalId and avatarUrl
   */
  async getUserProfile(userId: number) {
    const user = await this.usersService.findOneById(userId);
    if (!user) {
      throw new UnauthorizedException(AUTH_MESSAGES.INVALID_CREDENTIALS);
    }

    const userEntity = plainToInstance(UserEntity, user, {
      excludeExtraneousValues: false,
    });

    const roles =
      (user as UserWithRoles).userRoles?.map((ur) => ur.role.name) || [];

    return {
      externalId: userEntity.externalId,
      email: userEntity.email,
      username: userEntity.username,
      avatarUrl: userEntity.avatarUrl,
      roles,
    };
  }
}
