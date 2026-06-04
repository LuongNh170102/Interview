import { LocalizedString } from './localized-string.interface';

export interface ProductMetadata {
  images?: string[];
  thumbnail?: string;
  category?: string;
  [key: string]: unknown;
}

export interface DecimalResponse {
  s?: number;
  e?: number;
  d?: number[] | string;
}

export interface ProductMerchantSummary {
  id: number;
  externalId: string;
  name: LocalizedString;
  approvalStatus?: string;
  isAcceptingOrders?: boolean;
}

export interface ProductResponse {
  id: number;
  externalId: string;
  merchantId: number;
  merchant?: ProductMerchantSummary;
  name: LocalizedString;
  description?: LocalizedString | null;
  price?: string | number | DecimalResponse | null;
  currency?: string | null;
  sku?: string | null;
  stock?: number | null;
  isActive?: boolean | null;
  metadata?: ProductMetadata | null;
  averageRating?: number;
  totalReviews?: number;
  createdAt: string | Date;
  updatedAt?: string | Date | null;
}

export interface ProductListResponse {
  data: ProductResponse[];
  meta: {
    total: number;
    page: number;
    lastPage: number;
    limit: number;
  };
}

export interface ProductQueryParams {
  page?: number;
  limit?: number;
}

export interface UpdateProductRequest {
  name?: LocalizedString;
  description?: LocalizedString;
  price?: number;
  sku?: string;
  stock?: number;
  isActive?: boolean;
  metadata?: ProductMetadata;
}
