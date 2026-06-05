import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

function normalizeOrigin(url: string): string | null {
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return null;
  }
}

export function getAllowedFrontendOrigins(
  configService: ConfigService
): string[] {
  const candidates = [
    configService.get<string>('FRONTEND_URL'),
    configService.get<string>('B2B_FRONTEND_URL'),
    configService.get<string>('MANAGEMENT_FRONTEND_URL'),
    configService.get<string>('B2C_FRONTEND_URL'),
    'http://localhost:4200',
    'http://localhost:4300',
    'http://localhost:4400',
  ];

  const origins = new Set<string>();
  for (const candidate of candidates) {
    const origin = candidate ? normalizeOrigin(candidate) : null;
    if (origin) {
      origins.add(origin);
    }
  }
  return [...origins];
}

export function resolveAllowedFrontendUrl(
  req: Request,
  configService: ConfigService
): string {
  const allowlist = getAllowedFrontendOrigins(configService);
  const defaultUrl =
    normalizeOrigin(configService.get<string>('FRONTEND_URL') ?? '') ??
    allowlist[0];

  const host = req.get('host');
  if (!host) {
    return defaultUrl ?? 'http://localhost:4200';
  }

  const protocol =
    req.secure || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
  const requestOrigin = `${protocol}://${host}`;

  if (allowlist.includes(requestOrigin)) {
    return requestOrigin;
  }

  throw new BadRequestException('Invalid frontend origin');
}
