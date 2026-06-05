import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  COURIER_AVAILABILITY_STATUS,
  COURIER_OPERATIONAL_STATUS,
} from '../../common/constants/courier.constant';
import { CourierLocationDto } from './create-courier.dto';

export class UpdateCourierDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  vehicleType?: string;

  @IsOptional()
  @IsEnum(COURIER_OPERATIONAL_STATUS)
  operationalStatus?: COURIER_OPERATIONAL_STATUS;

  @IsOptional()
  @IsEnum(COURIER_AVAILABILITY_STATUS)
  status?: COURIER_AVAILABILITY_STATUS;

  @IsOptional()
  @ValidateNested()
  @Type(() => CourierLocationDto)
  currentLocation?: CourierLocationDto;
}
