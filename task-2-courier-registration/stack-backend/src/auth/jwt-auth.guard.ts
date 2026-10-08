import { IS_PUBLIC_KEY } from "@/src/decorator";
import { prisma } from "@/src/utils";
import { ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthGuard } from "@nestjs/passport";
@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  constructor(private reflector: Reflector) {
    super();
  }
  async canActivate(context: ExecutionContext): Promise<any> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()]);
    if (isPublic) {
      return true;
    } else {
      const request = context.switchToHttp().getRequest();
      const [type, token] = request.headers.authorization?.split(" ") ?? [];
      const accessToken: string = type === "Bearer" ? token : undefined;
      if (!accessToken) {
        throw new UnauthorizedException();
      }
      const userRow: any = await prisma.users.findFirstOrThrow({
        where: { token: accessToken }
      });
      if (!userRow) {
        throw new UnauthorizedException();
      }
      return super.canActivate(context);
    }
  }
}
