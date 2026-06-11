import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { COURIER_STATUS } from '../../common/constants/courier.constant';

export class ApproveCourierDto {
  @IsNotEmpty()
  @IsEnum(COURIER_STATUS)
  status: COURIER_STATUS;
}

export class RejectCourierDto {
  @IsNotEmpty()
  @IsEnum(COURIER_STATUS)
  status: COURIER_STATUS;

  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
