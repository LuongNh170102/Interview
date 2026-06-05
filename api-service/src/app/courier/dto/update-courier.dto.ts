import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import {
  COURIER_AVAILABILITY_STATUS,
  COURIER_OPERATIONAL_STATUS,
} from '../../common/constants/courier.constant';

export class UpdateCourierDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  vehicleType?: string;

  @IsOptional()
  currentLocation?: Record<string, unknown>;

  @IsOptional()
  @IsEnum(COURIER_AVAILABILITY_STATUS)
  status?: COURIER_AVAILABILITY_STATUS;

  @IsOptional()
  @IsEnum(COURIER_OPERATIONAL_STATUS)
  operationalStatus?: COURIER_OPERATIONAL_STATUS;

  @IsOptional()
  @IsString()
  statusReason?: string;
}
