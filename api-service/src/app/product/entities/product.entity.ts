import { Exclude } from 'class-transformer';
import { BaseEntity } from '../../common/entities/base.entity';
import { Prisma, Product, ProductStatus } from '@prisma/client';
import { ProductMetadataDto } from '../dto/create-product.dto';

export interface ProductRelations {
  merchant?: Merchant | null;
}

export interface Merchant {
  name: string
  address: string | null
  contactName: string | null
  businessType: string | null
  externalId: string
  logoUrl: string | null
}

/**
 * Product entity for API responses.
 * Excludes internal IDs and sensitive approval metadata.
 */
export class ProductEntity extends BaseEntity {
  externalId!: string;
  name!: string;
  description!: string | null;
  price!: number
  currency!: string
  sku!: string | null
  stock!: number
  isActive!: boolean
  metadata!: ProductMetadataDto | null
  averageRating!: number
  totalReviews!: number
  status!: ProductStatus

  createdAt!: Date;
  updatedAt?: Date | null;

  merchant!: Merchant | null

  @Exclude()
  merchantId!: number;

  @Exclude()
  sectionId?: number | null;

  constructor(partial: Partial<Product>, relations?: ProductRelations) {
    super(partial);
    Object.assign(this, partial);

    this.price =
      partial.price instanceof Prisma.Decimal
        ? partial.price.toNumber()
        : Number(partial.price ?? 0);

    this.merchant = relations?.merchant
      ? {
        name: relations.merchant.name,
        address: relations.merchant.address,
        contactName: relations.merchant.contactName,
        businessType: relations.merchant.businessType,
        externalId: relations.merchant.externalId,
        logoUrl: relations.merchant.logoUrl
      }
      : null;

  }
}
