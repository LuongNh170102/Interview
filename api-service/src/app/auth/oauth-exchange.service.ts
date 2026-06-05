import { Injectable, UnauthorizedException } from '@nestjs/common';
import { randomBytes } from 'crypto';

interface OAuthExchangePayload {
  access_token: string;
  user: unknown;
  permissions: string[];
  refresh_token: string;
}

interface OAuthExchangeEntry {
  payload: OAuthExchangePayload;
  expiresAt: number;
}

@Injectable()
export class OAuthExchangeService {
  private readonly store = new Map<string, OAuthExchangeEntry>();
  private readonly ttlMs = 60_000;

  createCode(payload: OAuthExchangePayload): string {
    this.cleanupExpired();
    const code = randomBytes(24).toString('hex');
    this.store.set(code, {
      payload,
      expiresAt: Date.now() + this.ttlMs,
    });
    return code;
  }

  consumeCode(code: string): OAuthExchangePayload {
    this.cleanupExpired();
    const entry = this.store.get(code);
    if (!entry) {
      throw new UnauthorizedException('Invalid or expired OAuth code');
    }
    this.store.delete(code);
    if (Date.now() > entry.expiresAt) {
      throw new UnauthorizedException('Invalid or expired OAuth code');
    }
    return entry.payload;
  }

  private cleanupExpired(): void {
    const now = Date.now();
    for (const [code, entry] of this.store.entries()) {
      if (entry.expiresAt <= now) {
        this.store.delete(code);
      }
    }
  }
}
