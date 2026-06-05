import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';
import { COURIER_APPROVAL_STATUS } from '../../common/constants/courier.constant';

export class UpdateCourierApprovalDto {
  @IsNotEmpty()
  @IsEnum(COURIER_APPROVAL_STATUS)
  status!: COURIER_APPROVAL_STATUS;

  @ValidateIf((dto) => dto.status === COURIER_APPROVAL_STATUS.REJECTED)
  @IsString()
  @IsNotEmpty()
  rejectionReason?: string;

  @IsOptional()
  @IsString()
  statusReason?: string;
}
