import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-kakao';
import { ConfigService } from '@nestjs/config';
import {
  KakaoProfile,
  KakaoStrategyProfile,
} from '../../common/interfaces/auth.interface';

@Injectable()
export class KakaoStrategy extends PassportStrategy(Strategy, 'kakao') {
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.get<string>('KAKAO_CLIENT_ID'),
      clientSecret: configService.get<string>('KAKAO_CLIENT_SECRET'),
      callbackURL:
        configService.get<string>('FRONTEND_URL') + '/api/auth/kakao/callback',
      scope: ['profile_nickname', 'profile_image'],
    } as any);
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: KakaoStrategyProfile,
    done: (error: Error | null, user?: KakaoProfile | false) => void
  ): Promise<void> {
    const { id, username, displayName, _json } = profile;
    const kakaoAccount = _json.kakao_account;

    const kakaoProfile: KakaoProfile = {
      provider: 'kakao',
      providerId: id.toString(),
      //TODO: Handle case where email is not provided
      email: kakaoAccount?.email || `kakao_${id}@vhandelivery.com`,
      displayName: displayName || username || `Kakao User ${id}`,
      avatarUrl: kakaoAccount?.profile?.profile_image_url || '',
      accessToken,
      refreshToken,
    };

    done(null, kakaoProfile);
  }
}
