import { AgencyResponse } from './agency.interface';
import { LocalizedString } from './localized-string.interface';
import { MerchantResponse } from './merchant.interface';

export interface CreateBrandRequest {
  name: string;
  description?: string;
  slug?: string;
  businessCategory?: string;
}

export interface CreateBranchRequest {
  name: string;
  address: string;
  city: string;
  phone: string;
  contactName?: string;
  businessCategory?: string;
  latitude?: number;
  longitude?: number;
  categoryIds?: string[];
}

export interface BrandResponse {
  id: number;
  externalId: string;
  name?: string | null;
  slug?: string | null;
  description?: LocalizedString | null;
  metadata?: any;
  businessCategory?: string | null;
  agencyId?: number | null;
  agency?: AgencyResponse;
  merchants?: MerchantResponse[];
  createdAt?: Date | string;
  updatedAt?: Date | string | null;
}
