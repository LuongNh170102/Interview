import { Exclude } from 'class-transformer';
import { Category, MenuSection, Merchant, Product } from '@prisma/client';
import { BaseEntity } from '../../common/entities/base.entity';

export interface ProductMerchantInfo {
  externalId: string;
  name: string;
  approvalStatus: string;
}

export interface ProductCategoryInfo {
  externalId: string;
  name: unknown;
  slug: string | null;
}

export interface ProductSectionInfo {
  id: number;
  name: unknown;
  displayOrder: number;
}

export interface ProductRelations {
  merchant?: Partial<Merchant> | null;
  category?: Partial<Category> | null;
  section?: Partial<MenuSection> | null;
}

export class ProductEntity extends BaseEntity {
  externalId: string;
  name: unknown;
  description: unknown | null;
  price: number | null;
  currency: string | null;
  sku: string | null;
  stock: number | null;
  isActive: boolean | null;
  status: string;
  averageRating: number;
  totalReviews: number;
  createdAt: Date;
  updatedAt: Date | null;

  merchant: ProductMerchantInfo | null;
  category: ProductCategoryInfo | null;
  section: ProductSectionInfo | null;
  images: string[];
  thumbnail: string | null;

  @Exclude()
  merchantId: number;

  @Exclude()
  categoryId: number | null;

  @Exclude()
  sectionId: number | null;

  @Exclude()
  metadata: unknown;

  constructor(partial: Partial<Product>, relations?: ProductRelations) {
    super(partial);
    Object.assign(this, partial);

    this.price = partial.price === null ? null : Number(partial.price ?? 0);

    const metadata =
      partial.metadata && typeof partial.metadata === 'object'
        ? (partial.metadata as Record<string, unknown>)
        : null;

    this.merchant = relations?.merchant?.externalId
      ? {
          externalId: relations.merchant.externalId,
          name: relations.merchant.name ?? '',
          approvalStatus: String(relations.merchant.approvalStatus ?? ''),
        }
      : null;

    this.category = relations?.category?.externalId
      ? {
          externalId: relations.category.externalId,
          name: relations.category.name ?? null,
          slug: relations.category.slug ?? null,
        }
      : null;

    this.section = relations?.section?.id
      ? {
          id: relations.section.id,
          name: relations.section.name ?? null,
          displayOrder: relations.section.displayOrder ?? 0,
        }
      : null;

    this.images = Array.isArray(metadata?.images)
      ? metadata.images.filter(
          (value): value is string => typeof value === 'string'
        )
      : [];
    this.thumbnail =
      typeof metadata?.thumbnail === 'string' ? metadata.thumbnail : null;
  }
}
