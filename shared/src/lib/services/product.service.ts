import { LocalizedString } from "../interfaces/localized-string.interface";
import { PRODUCT_STATUS } from "../types/product-status.type";

export interface ProductMetadata {
    images: string[]
    thumbnail: string
}

export interface CreateProductRequest {
    sectionId?: number;
    name: LocalizedString
    description?: LocalizedString;
    price?: number;
    currency?: string;
    sku?: string;
    stock?: number;
    isActive?: boolean;
}

export interface UpdateProductRequest {
    name?: LocalizedString;
    description?: LocalizedString;
    price?: number;
    currency?: string;
    sku?: string;
    stock?: number;
    isActive?: boolean;
    status?: PRODUCT_STATUS;
}

export interface ProductResponse {
    externalId: string;
    sectionId: number | null;
    name: LocalizedString;
    description: LocalizedString;
    price: number | null;
    currency: string | null;
    sku: string | null;
    stock: number | null;
    isActive: boolean | null;
    metadata: unknown;
    averageRating: number;
    totalReviews: number;
    status: PRODUCT_STATUS;
    createdAt: string;
    updatedAt: string | null;
}


export interface ProductListResponse {
    data: ProductResponse[];
    total: number;
    page: number;
    limit: number;
}

export interface ProductQueryParams {
    page?: number;
    limit?: number;
    status?: PRODUCT_STATUS;
    isActive?: boolean;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
}