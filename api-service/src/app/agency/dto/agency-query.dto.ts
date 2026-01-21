import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class AgencyQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  include?: string;

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
