import { IsNotEmpty, IsOptional, IsString, IsEmail, IsPhoneNumber, IsBoolean } from 'class-validator';

export class CreateMerchantDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  address: string;

  @IsNotEmpty()
  @IsString()
  city: string;

  @IsNotEmpty()
  @IsString()
  contactName: string;

  @IsNotEmpty()
  @IsString()
  businessType: string;

  @IsNotEmpty()
  @IsString()
  businessCategory: string;

  @IsNotEmpty()
  @IsString()
  referralSource: string;

  @IsNotEmpty()
  @IsBoolean()
  hasBusinessLicense: boolean;

  @IsOptional()
  socialLinks?: any;

  @IsNotEmpty()
  @IsString()
  phone: string;

  @IsNotEmpty()
  @IsString()
  verificationToken: string;
}
