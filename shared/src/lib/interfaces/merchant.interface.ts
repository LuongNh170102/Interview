export interface CreateMerchantRequest {
  name: string;
  phone: string;
  verificationToken: string;
  address: string;
  city: string;
  contactName: string;
  businessType: string;
  businessCategory: string;
  referralSource: string;
  hasBusinessLicense: boolean;
  socialLinks?: unknown;
}

export interface MerchantResponse {
  id: number;
  externalId: string;
  name: string;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  contactName?: string | null;
  businessType?: string | null;
  businessCategory?: string | null;
  referralSource?: string | null;
  hasBusinessLicense?: boolean | null;
  metadata?: unknown;
  status?: string | null;
  ownerId?: number | null;
  brandId?: number | null;
  agencyId?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  createdAt: string | Date;
  updatedAt?: string | Date | null;
}

/**
 * Tag info from API
 */
export interface MerchantTagInfo {
  code: string;
  name: unknown;
  icon: string | null;
  color: string | null;
}

/**
 * Agency info (grouped from API)
 */
export interface MerchantAgencyInfo {
  externalId: string;
  name: string;
  phone: string | null;
}

/**
 * Brand info (grouped from API)
 */
export interface MerchantBrandInfo {
  externalId: string;
  name: string;
  slug: string | null;
}

/**
 * Owner info (grouped from API)
 */
export interface MerchantOwnerInfo {
  name: string;
  email: string | null;
  phone: string | null;
}

/**
 * Merchant API response with all fields for list display
 */
export interface MerchantApiResponse {
  externalId: string;
  name: string;
  address: string | null;
  city: string | null;
  contactName: string | null;
  businessType: string | null;
  businessCategory: string | null;
  phone: string | null;
  approvalStatus: string;
  operationalStatus: string;
  averageRating: number;
  totalReviews: number;

  // Related entities (grouped)
  agency: MerchantAgencyInfo | null;
  brand: MerchantBrandInfo | null;
  owner: MerchantOwnerInfo | null;

  // Tags
  tags: MerchantTagInfo[];

  // Counts
  productCount: number;
  orderCount: number;

  createdAt: string;
}

/**
 * Statistics for merchants
 */
export interface MerchantStatistics {
  totalApproved: number;
  totalPending: number;
  totalActive: number;
}

/**
 * List response from API with pagination and optional statistics
 */
export interface MerchantListResponse {
  data: MerchantApiResponse[];
  total: number;
  page: number;
  limit: number;
  statistics?: MerchantStatistics;
}

/**
 * Query parameters for merchants API
 */
export interface MerchantQueryParams {
  page?: number;
  limit?: number;
  include?: string;
  approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
}
