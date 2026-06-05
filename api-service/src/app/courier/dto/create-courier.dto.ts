import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CourierLocationDto {
  @Type(() => Number)
  @IsNumber()
  lat: number;

  @Type(() => Number)
  @IsNumber()
  lng: number;
}

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
  @ValidateNested()
  @Type(() => CourierLocationDto)
  currentLocation?: CourierLocationDto;

  @IsNotEmpty()
  @IsString()
  verificationToken: string;
}
