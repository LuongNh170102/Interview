import { IsNotEmpty, IsOptional, IsString, IsEmail, IsPhoneNumber } from 'class-validator';

export class CreateAgencyDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  taxCode?: string;

  @IsOptional()
  @IsString()
  bankAccount?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsNotEmpty()
  @IsString()
  phone: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  logo?: string;

  @IsOptional()
  @IsString()
  businessLicenseUrl?: string;

  @IsNotEmpty()
  @IsString()
  verificationToken: string;
}
