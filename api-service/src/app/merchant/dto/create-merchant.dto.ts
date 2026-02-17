import { IsNotEmpty, IsOptional, IsString, IsBoolean } from 'class-validator';

/**
 * DTO for merchant self-registration (B2B flow).
 * Requires verificationToken from OTP verification.
 */
export class CreateMerchantDto {
  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsNotEmpty()
  @IsString()
  phone!: string;

  @IsNotEmpty()
  @IsString()
  verificationToken!: string;

  @IsNotEmpty()
  @IsString()
  address!: string;

  @IsNotEmpty()
  @IsString()
  city!: string;

  @IsNotEmpty()
  @IsString()
  contactName!: string;

  @IsNotEmpty()
  @IsString()
  businessType!: string;

  @IsNotEmpty()
  @IsString()
  businessCategory!: string;

  @IsNotEmpty()
  @IsBoolean()
  hasBusinessLicense!: boolean;

  @IsOptional()
  @IsString()
  referralSource?: string;

  @IsOptional()
  @IsString()
  socialLinks?: string;
}
