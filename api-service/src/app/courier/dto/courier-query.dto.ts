import { IsOptional, IsString, IsEnum } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { COURIER_APPROVAL_STATUS } from '../../common/constants/courier.constant';

export class CourierQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  include?: string;

  @IsOptional()
  @IsEnum(COURIER_APPROVAL_STATUS)
  approvalStatus?: COURIER_APPROVAL_STATUS;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  vehicleType?: string;

  get shouldIncludeStatistics(): boolean {
    return this.include?.split(',').includes('statistics') ?? false;
  }
}

export interface CourierStatistics {
  totalPending: number;
  totalApproved: number;
  totalRejected: number;
}

export interface CourierListResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  statistics?: CourierStatistics;
}
