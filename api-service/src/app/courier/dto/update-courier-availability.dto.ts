import { IsEnum, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { COURIER_AVAILABILITY_STATUS } from '../../common/constants/courier.constant';
import { CourierLocationDto } from './create-courier.dto';

export class UpdateCourierAvailabilityDto {
  @IsEnum(COURIER_AVAILABILITY_STATUS)
  status: COURIER_AVAILABILITY_STATUS;

  @IsOptional()
  @ValidateNested()
  @Type(() => CourierLocationDto)
  currentLocation?: CourierLocationDto;
}
