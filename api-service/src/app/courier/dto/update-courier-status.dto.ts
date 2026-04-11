import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { COURIER_STATUS } from '../constants/courier.constant';

export class UpdateCourierStatusDto {
  @IsNotEmpty()
  @IsEnum(COURIER_STATUS)
  status: COURIER_STATUS;

  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
