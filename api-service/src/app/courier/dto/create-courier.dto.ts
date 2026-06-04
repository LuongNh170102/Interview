import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCourierDto {
  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsNotEmpty()
  @IsString()
  phone!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  vehicleType?: string;

  @IsNotEmpty()
  @IsString()
  verificationToken!: string;
}
