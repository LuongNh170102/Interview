import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  /**
   * Build the frontend origin from the request Host header
   * Nginx preserves the original Host, so we can use it to redirect back
   */
  private getOriginFromHost(request: Request): string {
    const host = request.get('host') || 'localhost:4200';

    // Force HTTPS for production domains (non-localhost)
    // Check x-forwarded-proto header first, then request.secure, then default based on host
    const isLocalhost =
      host.includes('localhost') || host.includes('127.0.0.1');
    const forwardedProto = request.get('x-forwarded-proto');

    let protocol: string;
    if (forwardedProto) {
      // Trust the forwarded proto from reverse proxy
      protocol = forwardedProto.split(',')[0].trim(); // Handle "https, http" format
    } else if (request.secure) {
      protocol = 'https';
    } else if (isLocalhost) {
      protocol = 'http';
    } else {
      // Production should always be HTTPS
      protocol = 'https';
    }

    return `${protocol}://${host}`;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const result = (await super.canActivate(context)) as boolean;
    await super.logIn(context.switchToHttp().getRequest());
    return result;
  }

  /**
   * Override to pass dynamic callback URL based on Host header
   * This allows each frontend domain to have its own callback URL
   */
  getAuthenticateOptions(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    const origin = this.getOriginFromHost(request);

    return {
      // Dynamic callback URL based on Host header
      callbackURL: `${origin}/api/auth/google/callback`,
    };
  }

  handleRequest<TUser = unknown>(err: Error | null, user: TUser): TUser {
    if (err || !user) {
      throw err;
    }
    return user;
  }
}
