import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

/**
 * DTO for linking existing account with Google
 */
export class LinkGoogleAccountDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsString()
  @IsNotEmpty()
  googleId: string;

  @IsString()
  @IsOptional()
  displayName?: string;

  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @IsString()
  @IsOptional()
  accessToken?: string;

  @IsString()
  @IsOptional()
  refreshToken?: string;
}

/**
 * DTO for setting password on OAuth-only account
 */
export class SetPasswordDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}

/**
 * Response when Google account already exists - requires linking
 */
export interface GoogleAuthRequiresLinkingResponse {
  requiresLinking: true;
  email: string;
  googleId: string;
  displayName: string;
  avatarUrl: string;
  message: string;
}

/**
 * Response when Google login is successful
 */
export interface GoogleAuthSuccessResponse {
  requiresLinking: false;
  access_token: string;
  refresh_token: string;
  user: {
    externalId: string;
    email: string;
    username: string | null;
    avatarUrl: string | null;
    roles: string[];
  };
  permissions: string[];
}

export type GoogleAuthResponse =
  | GoogleAuthRequiresLinkingResponse
  | GoogleAuthSuccessResponse;
