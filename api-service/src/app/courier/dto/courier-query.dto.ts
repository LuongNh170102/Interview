import { IsOptional, IsEnum, IsString } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { COURIER_STATUS } from '../constants/courier.constant';

export class CourierQueryDto extends PaginationDto {
  @IsOptional()
  @IsEnum(COURIER_STATUS)
  approvalStatus?: string;

  @IsOptional()
  @IsString()
  search?: string;

  get shouldIncludeStatistics(): boolean {
    return this.include?.split(',').includes('statistics') ?? false;
  }
}

export interface CourierStatistics {
  totalPending: number;
  totalApproved: number;
  totalActive: number;
}

export interface CourierListResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  statistics?: CourierStatistics;
}
