import { IsNotEmpty, IsString, IsOptional, IsEmail, IsEnum } from 'class-validator';
import { VehicleType } from '@prisma/client';

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

  @IsNotEmpty()
  @IsString()
  @IsEnum(VehicleType)
  vehicleType!: VehicleType;

  @IsNotEmpty()
  @IsString()
  vehiclePlate!: string;

  @IsNotEmpty()
  @IsString()
  verificationToken!: string;
}