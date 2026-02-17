import { LocalizedString } from './localized-string.interface';

export interface CategoryResponse {
  id: number;
  externalId: string;
  name: LocalizedString;
  slug: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  children?: CategoryResponse[];
  parent?: CategoryResponse;
}

export interface CategoryQueryParams {
  page?: number;
  limit?: number;
  includeChildren?: boolean;
}

export interface CategoryListResponse {
  data: CategoryResponse[];
  total: number;
  page: number;
  limit: number;
}
