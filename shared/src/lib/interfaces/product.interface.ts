import { LocalizedString } from './localized-string.interface';

export const PRODUCT_STATUS = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  ARCHIVED: 'ARCHIVED',
} as const;

interface DecimalLikeValue {
  s?: number;
  e?: number;
  d?: number[];
}

function isDecimalLikeValue(value: unknown): value is DecimalLikeValue {
  return Boolean(
    value &&
      typeof value === 'object' &&
      Array.isArray((value as DecimalLikeValue).d) &&
      typeof (value as DecimalLikeValue).e === 'number'
  );
}

function decimalLikeToNumber(value: DecimalLikeValue): number | null {
  const segments = value.d ?? [];
  if (segments.length === 0) {
    return null;
  }

  const digits = segments
    .map((segment, index) =>
      index === 0
        ? `${Math.trunc(segment)}`
        : `${Math.abs(Math.trunc(segment))}`.padStart(7, '0')
    )
    .join('');

  const decimalIndex = (value.e ?? 0) + 1;
  let normalized = digits;

  if (decimalIndex <= 0) {
    normalized = `0.${'0'.repeat(Math.abs(decimalIndex))}${digits}`;
  } else if (decimalIndex < digits.length) {
    normalized = `${digits.slice(0, decimalIndex)}.${digits.slice(
      decimalIndex
    )}`;
  } else if (decimalIndex > digits.length) {
    normalized = `${digits}${'0'.repeat(decimalIndex - digits.length)}`;
  }

  const sign = value.s === -1 ? '-' : '';
  const parsed = Number(`${sign}${normalized}`);
  return Number.isFinite(parsed) ? parsed : null;
}

export function coerceNumericValue(value: unknown): number | null {
  if (value === null || typeof value === 'undefined') {
    return null;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  if (isDecimalLikeValue(value)) {
    return decimalLikeToNumber(value);
  }

  return null;
}

export type ProductStatusValue =
  (typeof PRODUCT_STATUS)[keyof typeof PRODUCT_STATUS];

export interface ProductMerchantInfo {
  externalId: string;
  name: string;
  approvalStatus: string;
}

export interface ProductCategoryInfo {
  externalId: string;
  name: LocalizedString | string | null;
  slug: string | null;
}

export interface ProductSectionInfo {
  id: number;
  name: LocalizedString | string | null;
}

export interface ProductResponse {
  externalId: string;
  name: LocalizedString | string;
  description: LocalizedString | string | null;
  price: number | null;
  currency: string | null;
  sku: string | null;
  stock: number | null;
  isActive: boolean | null;
  status: ProductStatusValue;
  averageRating: number;
  totalReviews: number;
  createdAt: string;
  updatedAt: string | null;
  thumbnail: string | null;
  images: string[];
  merchant: ProductMerchantInfo | null;
  category: ProductCategoryInfo | null;
  section: ProductSectionInfo | null;
}

export interface ProductStatistics {
  totalPublished: number;
  totalDraft: number;
  totalOutOfStock: number;
}

export interface ProductListResponse {
  data: ProductResponse[];
  total: number;
  page: number;
  limit: number;
  statistics?: ProductStatistics;
}

export interface ProductQueryParams {
  page?: number;
  limit?: number;
  include?: string;
  status?: ProductStatusValue;
  merchantId?: string;
  categoryId?: string;
  search?: string;
  isActive?: boolean;
  sectionId?: number;
}

export interface ProductMetadataPayload {
  images?: string[];
  thumbnail?: string;
}

export interface CreateProductRequest {
  merchantId: string;
  categoryId?: string;
  sectionId?: string;
  name: LocalizedString;
  description?: LocalizedString;
  price: number;
  sku: string;
  stock: number;
  currency?: string;
  status?: ProductStatusValue;
  isActive?: boolean;
  metadata?: ProductMetadataPayload;
  imageFiles?: File[];
}

export type UpdateProductRequest = Partial<CreateProductRequest>;
