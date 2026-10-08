import { IS_PUBLIC_KEY } from "@/src/decorator";
import { prisma } from "@/src/utils";
import { ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { AuthGuard } from "@nestjs/passport";
import { compareSync } from "bcryptjs";
@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  constructor(
    private reflector: Reflector,
    private confService: ConfigService,
    private jwt: JwtService
  ) {
    super();
  }
  async canActivate(context: ExecutionContext): Promise<any> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()]);
    if (isPublic) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const [type, token] = request.headers.authorization?.split(" ") ?? [];
    const accessToken: string = type === "Bearer" ? token : undefined;
    const payload = await this.jwt.verifyAsync(accessToken, {
      secret: this.confService.get<string>("JWT_SECRET")
    });
    const id: number = parseInt(payload.sub);
    const user: any = await prisma.users.findUniqueOrThrow({ where: { id } });
    if (!user || !user.token) {
      throw new UnauthorizedException();
    }
    const matchToken: boolean = await compareSync(accessToken, user.token);
    if (!matchToken) {
      throw new UnauthorizedException();
    }
    return super.canActivate(context);
  }
}
