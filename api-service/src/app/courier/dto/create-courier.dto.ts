import { IsNotEmpty, IsOptional, IsString, IsEmail } from 'class-validator';

export class CreateCourierDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  phone: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  vehicleType?: string; // 'bike' | 'motorbike' | 'car'

  @IsNotEmpty()
  @IsString()
  verificationToken: string;
}
