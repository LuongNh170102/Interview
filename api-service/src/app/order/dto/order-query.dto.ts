import { IsOptional, IsString, IsEnum } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class OrderQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  include?: string;

  @IsOptional()
  status?: string;

  @IsOptional()
  paymentStatus?: string;

  @IsOptional()
  @IsString()
  startDate?: string

  @IsOptional()
  @IsString()
  endDate?: string

  @IsOptional()
  merchantId?: number;

  @IsOptional()
  userId?: number;

  get shouldIncludeStatistics(): boolean {
    return this.include?.split(',').includes('statistics') ?? false;
  }
}

export interface OrderStatistics {
  totalCompleted: number;
  totalPending: number;
  totalCancelled: number;
}

export interface OrderListResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  statistics?: OrderStatistics;
}