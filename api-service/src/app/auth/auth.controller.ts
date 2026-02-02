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
  Delete,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import {
  LinkGoogleAccountDto,
  SetPasswordDto,
  GoogleAuthSuccessResponse,
} from './dto/google-auth.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { Request as ExpressRequest, Response } from 'express';
import { AUTH_MESSAGES } from '../common/constants/messages.constant';
import { TOKEN_TYPE } from '../common/constants/token.constant';
import { ConfigService } from '@nestjs/config';
import {
  AuthenticatedRequest,
  GoogleProfile,
  RequestWithCookies,
} from '../common/interfaces/auth.interface';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService
  ) {}

  /**
   * Get frontend URL from Host header
   * Nginx only accepts requests with valid server_name, so Host header is trusted
   */
  private getFrontendUrlFromHost(req: ExpressRequest): string {
    const defaultUrl = this.configService.get<string>('FRONTEND_URL');
    const host = req.get('host');
    if (!host) {
      return defaultUrl;
    }

    const protocol =
      req.secure || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
    return `${protocol}://${host}`;
  }

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
  async logout(
    @Request() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response
  ) {
    await this.authService.logout(req.user.userId);
    res.clearCookie(TOKEN_TYPE.REFRESH_TOKEN);
    return { message: AUTH_MESSAGES.LOGGED_OUT_SUCCESSFULLY };
  }

  @Post('refresh')
  async refresh(
    @Req() req: RequestWithCookies,
    @Res({ passthrough: true }) res: Response
  ) {
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
  async getProfile(@Request() req: AuthenticatedRequest) {
    return this.authService.getUserProfile(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('permissions')
  async getPermissions(@Request() req: AuthenticatedRequest) {
    const permissions = await this.authService.getUserPermissions(
      req.user.userId
    );
    return { permissions };
  }

  // ===========================================================================
  // GOOGLE OAUTH ENDPOINTS
  // ===========================================================================

  /**
   * Initiate Google OAuth flow
   * Frontend should redirect user to this endpoint
   */
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleAuth() {
    // Guard will redirect to Google
  }

  /**
   * Google OAuth callback
   * Google redirects here after authentication
   * Uses Host header to redirect back to the correct frontend
   */
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthCallback(
    @Req() req: ExpressRequest & { user: GoogleProfile },
    @Res() res: Response
  ) {
    const googleProfile = req.user;
    const result = await this.authService.handleGoogleAuth(googleProfile);

    // Get frontend URL from Host header (preserved by Nginx)
    const frontendUrl = this.getFrontendUrlFromHost(req);

    if (result.requiresLinking) {
      // Redirect to frontend with linking params
      const params = new URLSearchParams({
        requiresLinking: 'true',
        email: result.email,
        googleId: result.googleId,
        displayName: result.displayName || '',
        avatarUrl: result.avatarUrl || '',
      });
      return res.redirect(`${frontendUrl}/login?${params.toString()}`);
    }

    // Type narrowing: result is now GoogleAuthSuccessResponse
    const successResult = result as GoogleAuthSuccessResponse;

    // Success - set cookie and redirect
    res.cookie(TOKEN_TYPE.REFRESH_TOKEN, successResult.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // Allow redirect from Google
      maxAge: Number(process.env.MAX_AGE_REFRESH_COOKIE),
    });

    // Redirect to frontend with token in URL (short-lived, will be stored in memory)
    const params = new URLSearchParams({
      success: 'true',
      access_token: successResult.access_token,
      user: JSON.stringify(successResult.user),
      permissions: JSON.stringify(successResult.permissions),
    });
    return res.redirect(`${frontendUrl}/login?${params.toString()}`);
  }

  /**
   * Link Google account to existing user
   * Called from frontend when user confirms password
   */
  @Post('google/link')
  async linkGoogleAccount(
    @Body() dto: LinkGoogleAccountDto,
    @Res({ passthrough: true }) res: Response
  ) {
    const result = await this.authService.linkGoogleAccount(dto);

    if (!result.requiresLinking) {
      // Type narrowing: result is now GoogleAuthSuccessResponse
      const successResult = result as GoogleAuthSuccessResponse;

      res.cookie(TOKEN_TYPE.REFRESH_TOKEN, successResult.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: Number(process.env.MAX_AGE_REFRESH_COOKIE),
      });

      return {
        access_token: successResult.access_token,
        user: successResult.user,
        permissions: successResult.permissions,
        message: AUTH_MESSAGES.GOOGLE_LINK_SUCCESS,
      };
    }

    return result;
  }

  /**
   * Unlink Google account from current user
   */
  @UseGuards(JwtAuthGuard)
  @Delete('google/unlink')
  async unlinkGoogleAccount(@Request() req: AuthenticatedRequest) {
    await this.authService.unlinkGoogleAccount(req.user.userId);
    return { message: 'Google account unlinked successfully' };
  }

  /**
   * Get linked accounts for current user
   */
  @UseGuards(JwtAuthGuard)
  @Get('linked-accounts')
  async getLinkedAccounts(@Request() req: AuthenticatedRequest) {
    return this.authService.getLinkedAccounts(req.user.userId);
  }

  /**
   * Set password for OAuth-only users
   * Allows OAuth users to also use email/password login
   */
  @UseGuards(JwtAuthGuard)
  @Post('set-password')
  async setPassword(
    @Request() req: AuthenticatedRequest,
    @Body() dto: SetPasswordDto
  ) {
    await this.authService.setPassword(req.user.userId, dto.password);
    return { message: AUTH_MESSAGES.PASSWORD_SET_SUCCESS };
  }

  /**
   * Check if current user has password set
   */
  @UseGuards(JwtAuthGuard)
  @Get('has-password')
  async hasPassword(@Request() req: AuthenticatedRequest) {
    const hasPassword = await this.authService.hasPassword(req.user.userId);
    return { hasPassword };
  }
}
