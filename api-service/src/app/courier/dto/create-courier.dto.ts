import { IsNotEmpty, IsString, IsOptional, IsEmail } from 'class-validator';

export class CreateCourierDto {
  @IsNotEmpty()
  @IsString()
  fullName: string;

  @IsNotEmpty()
  @IsString()
  phone: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  vehicleType?: string; // motorbike, car, bicycle

  @IsOptional()
  @IsString()
  vehiclePlate?: string;

  @IsOptional()
  @IsString()
  identityCard?: string;

  @IsNotEmpty()
  @IsString()
  verificationToken: string;
}
