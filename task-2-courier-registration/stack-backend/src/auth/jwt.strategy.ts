import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private cfService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: cfService.get<string>("JWT_ACCESS_TOKEN_SECRET")
    });
  }

  async validate(payload: any) {
    const { id, username, email, fullname, phone, token } = payload;
    return { id, username, email, fullname, phone, token };
  }
}
