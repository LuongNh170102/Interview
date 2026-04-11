export interface ProductQueryParams {
  page?: number;
  limit?: number;
  merchantId?: string;
  search?: string;
  isActive?: boolean;
}

export interface ProductResponse {
  externalId: string;
  name: any;
  sku: string;
  price: number;
  stock: number;
  isActive: boolean;
  thumbnail?: string;
  createdAt: string;
}

export interface ProductListResponse {
  data: ProductResponse[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateProductRequest {
  name: any;
  description?: any;
  price: number;
  sku: string;
  stock: number;
  merchantId: number;
  isActive?: boolean;
}

export interface UpdateProductRequest {
  name?: any;
  description?: any;
  price?: number;
  stock?: number;
  isActive?: boolean;
}
