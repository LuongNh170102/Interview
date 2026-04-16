import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { COURIER_STATUS } from '../../common/constants/courier.constant';

export class UpdateCourierStatusDto {
    @IsNotEmpty()
    @IsEnum(COURIER_STATUS)
    status!: COURIER_STATUS;

    @IsOptional()
    rejectionReason?: string
}