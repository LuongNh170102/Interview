import { IsNotEmpty, IsEnum, IsOptional, IsString } from 'class-validator';
import { COURIER_APPROVAL_STATUS } from '../../common/constants/courier.constant';

export class UpdateCourierStatusDto {
  @IsNotEmpty()
  @IsEnum(COURIER_APPROVAL_STATUS)
  status: COURIER_APPROVAL_STATUS;

  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
