import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import {
  COURIER_AVAILABILITY_STATUS,
  COURIER_OPERATIONAL_STATUS,
  COURIER_STATUS,
} from '../../common/constants/courier.constant';

export class CourierQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  include?: string;

  @IsOptional()
  @IsEnum(COURIER_STATUS)
  approvalStatus?: string;

  @IsOptional()
  @IsEnum(COURIER_OPERATIONAL_STATUS)
  operationalStatus?: string;

  @IsOptional()
  @IsEnum(COURIER_AVAILABILITY_STATUS)
  availabilityStatus?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  get shouldIncludeStatistics(): boolean {
    return this.include?.split(',').includes('statistics') ?? false;
  }
}

export interface CourierStatistics {
  totalApproved: number;
  totalPending: number;
  totalActive: number;
}

export interface CourierListResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  statistics?: CourierStatistics;
}
