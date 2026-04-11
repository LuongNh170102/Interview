export interface Product {
  externalId: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  isActive: boolean;
  thumbnail?: string;
  images?: string[];
  createdAt: string;
}

export interface ProductListResponse {
  data: Product[];
  total: number;
  page: number;
  limit: number;
}

export interface ProductQueryParams {
  page?: number;
  limit?: number;
  search?: string;
}
