import { IsOptional, IsString, IsEnum } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import {
  AGENCY_STATUS,
  AGENCY_OPERATIONAL_STATUS,
} from '../../common/constants/agency.constant';

export class AgencyQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  include?: string;

  @IsOptional()
  @IsEnum(AGENCY_STATUS)
  approvalStatus?: string;

  @IsOptional()
  @IsEnum(AGENCY_OPERATIONAL_STATUS)
  operationalStatus?: string;

  @IsOptional()
  @IsString()
  search?: string;

  get shouldIncludeStatistics(): boolean {
    return this.include?.split(',').includes('statistics') ?? false;
  }
}

export interface AgencyStatistics {
  totalApproved: number;
  totalPending: number;
  totalActive: number;
}

export interface AgencyListResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  statistics?: AgencyStatistics;
}
