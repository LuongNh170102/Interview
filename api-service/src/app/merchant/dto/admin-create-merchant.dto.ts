import { OperationalStatus } from '@prisma/client';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsBoolean,
  IsEnum,
  IsEmail,
} from 'class-validator';

/**
 * DTO for admin creating a merchant directly.
 * Does NOT require verificationToken (no OTP flow).
 * Admin can set operationalStatus, agencyId, brandId, logoUrl.
 
 */
export class AdminCreateMerchantDto {
  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsNotEmpty()
  @IsString()
  phone!: string;

  @IsNotEmpty()
  @IsEmail()
  email!: string;

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
  @IsEnum(['ONLINE', 'OFFLINE', 'HYBRID'])
  businessType!: string;

  @IsNotEmpty()
  @IsString()
  businessCategory!: string;

  @IsNotEmpty()
  @IsBoolean()
  hasBusinessLicense!: boolean;

  @IsNotEmpty()
  @IsString()
  @IsEnum([OperationalStatus.ACTIVE, OperationalStatus.INACTIVE])
  operationalStatus!: string;

  // Optional fields
  @IsOptional()
  @IsString()
  referralSource?: string;

  @IsOptional()
  @IsString()
  socialLinks?: string;

  @IsOptional()
  @IsString()
  agencyId?: string;

  @IsOptional()
  @IsString()
  brandId?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;
}
