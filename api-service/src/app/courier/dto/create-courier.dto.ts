import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateCourierDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  phone: string;

  @IsNotEmpty()
  @IsString()
  vehicleType: string;

  @IsOptional()
  @IsString()
  vehicleNumber?: string;

  @IsOptional()
  @IsString()
  idCardNumber?: string;

  @IsOptional()
  @IsString()
  dateOfBirth?: string;

  @IsNotEmpty()
  @IsString()
  verificationToken: string;
}
