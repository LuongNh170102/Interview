import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Request,
  Res,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Response } from 'express';
import { AUTH_MESSAGES } from '../common/constants/messages.constant';
import { TOKEN_TYPE } from '../common/constants/token.constant';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response
  ) {
    const { refresh_token, ...result } = await this.authService.login(loginDto);

    res.cookie(TOKEN_TYPE.REFRESH_TOKEN, refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: Number(process.env.MAX_AGE_REFRESH_COOKIE),
    });

    return result;
  }

  @Post('register')
  async register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) res: Response
  ) {
    const { refresh_token, ...result } = await this.authService.register(
      registerDto
    );

    res.cookie(TOKEN_TYPE.REFRESH_TOKEN, refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: Number(process.env.MAX_AGE_REFRESH_COOKIE),
    });

    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Request() req: any, @Res({ passthrough: true }) res: Response) {
    await this.authService.logout(req.user.userId);
    res.clearCookie(TOKEN_TYPE.REFRESH_TOKEN);
    return { message: AUTH_MESSAGES.LOGGED_OUT_SUCCESSFULLY };
  }

  @Post('refresh')
  async refresh(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies['refresh_token'];
    if (!refreshToken)
      throw new UnauthorizedException(AUTH_MESSAGES.INVALID_REFRESH_TOKEN);

    const { refresh_token: newRefreshToken, ...result } =
      await this.authService.refreshTokens(refreshToken);

    res.cookie(TOKEN_TYPE.REFRESH_TOKEN, newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: Number(process.env.MAX_AGE_REFRESH_COOKIE),
    });

    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req: any) {
    return req.user;
  }

  @UseGuards(JwtAuthGuard)
  @Get('permissions')
  async getPermissions(@Request() req: any) {
    const permissions = await this.authService.getUserPermissions(req.user.userId);
    return { permissions };
  }
}
