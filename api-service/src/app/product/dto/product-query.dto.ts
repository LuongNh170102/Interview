import { IsOptional, IsString, IsEnum, IsNumber } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PRODUCT_STATUS } from '../../common/constants/product.constant';

export class ProductQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  include?: string;

  @IsOptional()
  @IsEnum(PRODUCT_STATUS)
  status?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  startDate?: string

  @IsOptional()
  @IsString()
  endDate?: string

  @IsOptional()
  @IsNumber()
  startPrice?: number

  @IsOptional()
  @IsNumber()
  endPrice?: number

  get shouldIncludeStatistics(): boolean {
    return this.include?.split(',').includes('products') ?? false;
  }
}

export interface ProductStatistics {
  totalDraft: number;
  totalPublished: number;
  totalArchived: number;
}

export interface ProductListResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  statistics?: ProductStatistics;
}
