import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEmail,
  MinLength,
} from 'class-validator';

export class RegisterCourierDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  phone: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  vehicleType?: string; // 'bike' | 'motorbike' | 'car'

  @IsOptional()
  @IsString()
  licenseNumber?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  address?: string;

  /**
   * JWT verification token returned from POST /couriers/otp/verify.
   * Proves that the courier verified their phone number via OTP.
   */
  @IsNotEmpty()
  @IsString()
  verificationToken: string;
}
