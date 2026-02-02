import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  /**
   * Production domains from environment variable
   * Format: comma-separated list of domains (e.g., "sharkbee.vn,vhandelivery.com")
   */
  private readonly productionDomains: string[] = (
    process.env['PRODUCTION_DOMAINS'] || ''
  )
    .split(',')
    .map((d) => d.trim())
    .filter(Boolean);

  /**
   * Build the frontend origin from the request Host header
   * Nginx preserves the original Host, so we can use it to redirect back
   */
  private getOriginFromHost(request: Request): string {
    const host = request.get('host') || 'localhost:4200';

    // Check if host contains any production domain
    const isProductionDomain = this.productionDomains.some((domain) =>
      host.includes(domain)
    );

    let protocol: string;
    if (isProductionDomain) {
      protocol = 'https';
    } else {
      protocol =
        request.secure || request.get('x-forwarded-proto') === 'https'
          ? 'https'
          : 'http';
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
