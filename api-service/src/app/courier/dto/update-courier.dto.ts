import { IsEnum, IsOptional, IsString } from 'class-validator';
import { COURIER_AVAILABILITY_STATUS } from '../../common/constants/courier.constant';

export class UpdateCourierDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  vehicleType?: string;

  @IsOptional()
  @IsEnum(COURIER_AVAILABILITY_STATUS)
  availabilityStatus?: COURIER_AVAILABILITY_STATUS;
}
