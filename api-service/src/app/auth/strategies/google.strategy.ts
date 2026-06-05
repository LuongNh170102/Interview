import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { GoogleProfile } from '../../common/interfaces/auth.interface';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private configService: ConfigService) {
    const frontendUrl =
      configService.get<string>('FRONTEND_URL') || 'http://localhost:4300';

    super({
      clientID:
        configService.get<string>('GOOGLE_CLIENT_ID') ||
        'local-google-client-id',
      clientSecret:
        configService.get<string>('GOOGLE_CLIENT_SECRET') ||
        'local-google-client-secret',
      // Callback URL is set dynamically by GoogleAuthGuard based on Host header
      // This placeholder will be overridden at runtime
      callbackURL: `${frontendUrl}/api/auth/google/callback`,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback
  ): Promise<void> {
    const { id, emails, displayName, name, photos } = profile;

    const googleProfile: GoogleProfile = {
      provider: 'google',
      providerId: id,
      email: emails?.[0]?.value || '',
      displayName: displayName || '',
      firstName: name?.givenName || '',
      lastName: name?.familyName || '',
      avatarUrl: photos?.[0]?.value || '',
      accessToken,
      refreshToken,
    };

    done(null, googleProfile);
  }
}
