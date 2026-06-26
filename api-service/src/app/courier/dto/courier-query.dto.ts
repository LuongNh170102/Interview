import { IsOptional, IsString, IsEnum } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import {
  COURIER_APPROVAL_STATUS,
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
  operationalStatus?: string; // matches 'status' field in Prisma

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  shouldIncludeStatistics?: string;

  get hasStatistics(): boolean {
    return (
      this.shouldIncludeStatistics === 'true' ||
      this.include?.split(',').includes('statistics') ||
      false
    );
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
