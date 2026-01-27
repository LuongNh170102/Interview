import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class MerchantQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  include?: string;

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
