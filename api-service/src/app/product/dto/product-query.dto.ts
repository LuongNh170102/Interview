import { Type } from 'class-transformer';
import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export const PUBLIC_PRODUCT_SORT_OPTIONS = [
  'newest',
  'price-asc',
  'price-desc',
  'rating',
] as const;

export type PublicProductSort = (typeof PUBLIC_PRODUCT_SORT_OPTIONS)[number];

export class ProductQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  merchantId?: string;

  /** Comma-separated merchant external IDs (B2C multi-select) */
  @IsOptional()
  @IsString()
  merchantIds?: string;

  /** Comma-separated category external IDs */
  @IsOptional()
  @IsString()
  categoryIds?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @IsIn(PUBLIC_PRODUCT_SORT_OPTIONS)
  sortBy?: PublicProductSort;
}
