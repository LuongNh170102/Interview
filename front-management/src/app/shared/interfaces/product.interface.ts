export interface LocalizedString {
  en?: string;
  vi?: string;
  ko?: string;
}

export interface Product {
  externalId: string;
  name: LocalizedString | string;
  description?: LocalizedString | string;
  sku: string;
  price: number;
  stock: number;
  isActive: boolean;
  thumbnail?: string;
  images?: string[];
  categoryId?: number;
  merchantId: number;
  createdAt: string;
  updatedAt?: string;
}

export type ProductResponse = Product;

export interface ProductListResponse {
  data: Product[];
  total: number;
  page: number;
  limit: number;
  meta?: {
    total: number;
    page: number;
    limit: number;
  };
}

export interface ProductQueryParams {
  page?: number;
  limit?: number;
  merchantId?: string;
  search?: string;
  isActive?: boolean;
  categoryId?: number;
}

export interface CreateProductRequest {
  name: LocalizedString | string;
  description?: LocalizedString | string;
  sku: string;
  price: number;
  stock: number;
  isActive?: boolean;
  merchantId: number;
  categoryId?: number;
  images?: File[];
}

export interface UpdateProductRequest {
  name?: LocalizedString | string;
  description?: LocalizedString | string;
  price?: number;
  stock?: number;
  isActive?: boolean;
  categoryId?: number;
}
