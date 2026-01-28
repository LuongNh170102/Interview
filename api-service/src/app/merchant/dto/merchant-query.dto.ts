import { IsOptional, IsString, IsEnum, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../common/dto/pagination.dto';
import {
  MERCHANT_STATUS,
  MERCHANT_OPERATIONAL_STATUS,
} from '../../common/constants/merchant.constant';

export class MerchantQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  include?: string;

  @IsOptional()
  @IsEnum(MERCHANT_STATUS)
  approvalStatus?: string;

  @IsOptional()
  @IsEnum(MERCHANT_OPERATIONAL_STATUS)
  operationalStatus?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  agencyId?: number;

  @IsOptional()
  @IsString()
  businessCategory?: string;

  get shouldIncludeStatistics(): boolean {
    return this.include?.split(',').includes('statistics') ?? false;
  }
}

export interface MerchantStatistics {
  totalApproved: number;
  totalPending: number;
  totalActive: number;
}

export interface MerchantListResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  statistics?: MerchantStatistics;
}
