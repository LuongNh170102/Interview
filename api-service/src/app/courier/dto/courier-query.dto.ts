import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import {
  COURIER_APPROVAL_STATUS,
  COURIER_AVAILABILITY_STATUS,
  COURIER_OPERATIONAL_STATUS,
} from '../../common/constants/courier.constant';

export class CourierQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  include?: string;

  @IsOptional()
  @IsEnum(COURIER_APPROVAL_STATUS)
  approvalStatus?: string;

  @IsOptional()
  @IsEnum(COURIER_OPERATIONAL_STATUS)
  operationalStatus?: string;

  @IsOptional()
  @IsEnum(COURIER_AVAILABILITY_STATUS)
  status?: string;

  @IsOptional()
  @IsString()
  search?: string;

  get shouldIncludeStatistics(): boolean {
    return this.include?.split(',').includes('statistics') ?? false;
  }
}

export interface CourierStatistics {
  totalApproved: number;
  totalPending: number;
  totalOnline: number;
}

export interface CourierListResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  statistics?: CourierStatistics;
}
