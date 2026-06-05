import { LocalizedString } from './localized-string.interface';

export type ProductPublishStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface ProductMetadata {
  images?: string[];
  thumbnail?: string;
  categoryId?: string;
}

export interface ProductResponse {
  id: number;
  externalId: string;
  merchantId: number;
  name: LocalizedString;
  description?: LocalizedString | null;
  price: string | number | null;
  currency?: string | null;
  sku?: string | null;
  stock?: number | null;
  isActive?: boolean | null;
  publishStatus?: ProductPublishStatus | null;
  metadata?: ProductMetadata | null;
  averageRating?: number;
  totalReviews?: number;
  createdAt: string;
  updatedAt?: string | null;
  merchant?: {
    externalId: string;
    name?: string | null;
    address?: string | null;
    city?: string | null;
  };
}

export interface ProductListMeta {
  total: number;
  page: number;
  lastPage: number;
  limit: number;
}

export interface ProductListResponse {
  data: ProductResponse[];
  meta: ProductListMeta;
}

export type PublicProductSort = 'newest' | 'price-asc' | 'price-desc' | 'rating';

export interface ProductQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  merchantId?: string;
  merchantIds?: string;
  categoryIds?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: PublicProductSort;
}

export interface PublicProductFilterMerchant {
  id: string;
  name: string | null;
  count: number;
}

export interface PublicProductFilterCategory {
  id: string;
  name: LocalizedString;
  count: number;
}

export interface PublicProductFilters {
  merchants: PublicProductFilterMerchant[];
  categories: PublicProductFilterCategory[];
  priceRange: { min: number; max: number };
}

export interface CreateProductRequest {
  name: LocalizedString;
  description?: LocalizedString;
  price: number;
  sku: string;
  stock: number;
  categoryId?: string;
  isActive?: boolean;
  publishStatus?: ProductPublishStatus;
}

export interface UpdateProductRequest {
  name?: LocalizedString;
  description?: LocalizedString;
  price?: number;
  sku?: string;
  stock?: number;
  categoryId?: string;
  isActive?: boolean;
  publishStatus?: ProductPublishStatus;
}
