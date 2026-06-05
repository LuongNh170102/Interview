import {
  coerceNumericValue,
  LocalizedString,
  ProductResponse,
  TranslationService,
} from '@vhandelivery/shared-ui';

export interface ProductRow {
  [key: string]: unknown;
  readonly id: string;
  readonly name: string;
  readonly sku: string;
  readonly thumbnail: string | null;
  readonly merchantName: string;
  readonly categoryName: string;
  readonly priceDisplay: string;
  readonly stock: number;
  readonly productStatus: 'draft' | 'published' | 'archived';
  readonly activeStatus: 'active' | 'inactive';
  readonly createdAt: string;
  readonly source: ProductResponse;
}

export function mapProductStatusToUI(
  status: string
): 'draft' | 'published' | 'archived' {
  switch (status) {
    case 'PUBLISHED':
      return 'published';
    case 'ARCHIVED':
      return 'archived';
    default:
      return 'draft';
  }
}

export function mapProductActiveStatus(
  isActive: boolean | null | undefined
): 'active' | 'inactive' {
  return isActive ? 'active' : 'inactive';
}

export function resolveLocalizedText(
  value: LocalizedString | string | null | undefined,
  translationService: TranslationService
): string {
  if (!value) {
    return '';
  }

  if (typeof value === 'string') {
    return value;
  }

  return translationService.getLocalizedValue(value, 'vi');
}

export function mapProductToRow(
  product: ProductResponse,
  translationService: TranslationService
): ProductRow {
  return {
    id: product.externalId,
    name: resolveLocalizedText(product.name, translationService),
    sku: product.sku ?? '-',
    thumbnail: product.thumbnail,
    merchantName: product.merchant?.name ?? '-',
    categoryName:
      resolveLocalizedText(product.category?.name, translationService) || '-',
    priceDisplay:
      coerceNumericValue(product.price) !== null
        ? `${coerceNumericValue(product.price)?.toLocaleString('vi-VN')} ${
            product.currency ?? 'VND'
          }`
        : '-',
    stock: product.stock ?? 0,
    productStatus: mapProductStatusToUI(product.status),
    activeStatus: mapProductActiveStatus(product.isActive),
    createdAt: product.createdAt,
    source: product,
  };
}
