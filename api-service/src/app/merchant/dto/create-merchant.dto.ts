import { IsNotEmpty, IsOptional, IsString, IsEmail, IsPhoneNumber } from 'class-validator';

export class CreateMerchantDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsNotEmpty()
  @IsString()
  phone: string;

  @IsOptional()
  @IsString()
  verificationToken: string;
}
