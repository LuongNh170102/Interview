import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { AuthSuccessResponse } from '../../common/interfaces/auth.interface';

/**
 * DTO for linking existing account with Kakao
 */
export class LinkKakaoAccountDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsString()
  @IsNotEmpty()
  kakaoId: string;

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
 * DTO for setting password for Kakao-only users
 */
export class SetKakaoPasswordDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}

/**
 * Response when Kakao account already exists - requires linking
 */
export interface KakaoAuthRequiresLinkingResponse {
  requiresLinking: true;
  email: string;
  kakaoId: string;
  displayName: string;
  avatarUrl: string;
  message: string;
}

/**
 * Response when Kakao login is successful
 */
export type KakaoAuthSuccessResponse = AuthSuccessResponse;

export type KakaoAuthResponse =
  | KakaoAuthRequiresLinkingResponse
  | KakaoAuthSuccessResponse;
