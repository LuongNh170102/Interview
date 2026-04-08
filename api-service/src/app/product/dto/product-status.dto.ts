import { IsNotEmpty, IsString, IsEnum, IsOptional } from 'class-validator';

export enum ProductStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export class UpdateProductStatusDto {
  @IsNotEmpty()
  @IsEnum(ProductStatus)
  status: ProductStatus;
}

export class PublicProductQueryDto {
  @IsOptional()
  @IsString()
  merchantId?: string; // externalId of merchant to scope results

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  category?: string;
}
