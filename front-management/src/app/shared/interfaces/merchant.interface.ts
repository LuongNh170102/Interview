/**
 * Tag info for display
 */
export interface MerchantTag {
  readonly code: string;
  readonly name: string;
  readonly icon: string | null;
  readonly color: string | null;
}

/**
 * Agency info (grouped from API)
 */
export interface MerchantAgencyInfo {
  readonly externalId: string;
  readonly name: string;
  readonly phone: string | null;
}

/**
 * Brand info (grouped from API)
 */
export interface MerchantBrandInfo {
  readonly externalId: string;
  readonly name: string;
  readonly slug: string | null;
}

/**
 * Owner info (grouped from API)
 */
export interface MerchantOwnerInfo {
  readonly name: string;
  readonly email: string | null;
  readonly phone: string | null;
}

/**
 * Merchant interface for DataTable display
 * Maps API response to UI display format
 */
export interface Merchant {
  [key: string]: unknown;
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly initials: string;
  readonly initialsColor: string;
  readonly phone: string;
  readonly address: string;
  readonly city: string;
  readonly contactName: string;

  // Related entities (grouped)
  readonly agency: MerchantAgencyInfo | null;
  readonly brand: MerchantBrandInfo | null;
  readonly owner: MerchantOwnerInfo | null;
  readonly tags: MerchantTag[];

  // Flattened for table display
  readonly agencyName: string;
  readonly brandName: string;
  readonly brandSlug: string;
  readonly ownerName: string;
  readonly ownerEmail: string;

  readonly businessType: string;
  readonly businessCategory: string;
  readonly approvalStatus: 'pending' | 'approved' | 'rejected';
  readonly operationalStatus: 'active' | 'inactive' | 'suspended' | 'locked';
  readonly averageRating: number;
  readonly totalReviews: number;

  // Counts
  readonly productCount: number;
  readonly orderCount: number;

  readonly createdAt: string;
}

/**
 * Tag info from API
 */
export interface MerchantTagApiResponse {
  code: string;
  name: unknown;
  icon: string | null;
  color: string | null;
}

/**
 * Agency info from API (grouped)
 */
export interface MerchantAgencyApiResponse {
  externalId: string;
  name: string;
  phone: string | null;
}

/**
 * Brand info from API (grouped)
 */
export interface MerchantBrandApiResponse {
  externalId: string;
  name: string;
  slug: string | null;
}

/**
 * Owner info from API (grouped)
 */
export interface MerchantOwnerApiResponse {
  name: string;
  email: string | null;
  phone: string | null;
}

/**
 * Merchant response from API (before mapping)
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
  agency: MerchantAgencyApiResponse | null;
  brand: MerchantBrandApiResponse | null;
  owner: MerchantOwnerApiResponse | null;
  tags: MerchantTagApiResponse[];

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
}

/**
 * Maps OperationalStatus from API to UI status
 */
export function mapMerchantOperationalStatus(
  status: string
): 'active' | 'inactive' | 'suspended' | 'locked' {
  const statusMap: Record<
    string,
    'active' | 'inactive' | 'suspended' | 'locked'
  > = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    SUSPENDED: 'suspended',
    LOCKED: 'locked',
  };
  return statusMap[status] ?? 'inactive';
}

/**
 * Maps ApprovalStatus from API to UI status
 */
export function mapMerchantApprovalStatus(
  status: string
): 'pending' | 'approved' | 'rejected' {
  const statusMap: Record<string, 'pending' | 'approved' | 'rejected'> = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
  };
  return statusMap[status] ?? 'pending';
}

/**
 * Generate initials from merchant name (first 2 characters of first word)
 */
export function generateMerchantInitials(name: string): string {
  if (!name) return '??';
  const words = name.trim().split(' ');
  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }
  return (words[0][0] + words[1][0]).toUpperCase();
}

/**
 * Generate a consistent color based on merchant name
 */
export function generateMerchantInitialsColor(name: string): string {
  const colors = [
    '#FFE4E1', // Misty Rose
    '#E6E6FA', // Lavender
    '#F0FFF0', // Honeydew
    '#FFF0F5', // Lavender Blush
    '#F5F5DC', // Beige
    '#E0FFFF', // Light Cyan
    '#FAFAD2', // Light Goldenrod
    '#D8BFD8', // Thistle
    '#FFDAB9', // Peach Puff
    '#B0E0E6', // Powder Blue
  ];

  if (!name) return colors[0];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}

/**
 * Map business category to display label
 */
export function mapBusinessCategory(category: string | null): string {
  if (!category) return 'Chưa phân loại';

  const categoryMap: Record<string, string> = {
    'F&B': 'F&B',
    RESTAURANT: 'Nhà hàng',
    CAFE: 'Cà phê & Đồ uống',
    BAKERY: 'Tiệm bánh',
    FAST_FOOD: 'Thức ăn nhanh',
    GROCERY: 'Tạp hóa',
    RETAIL: 'Bán lẻ',
    OTHER: 'Khác',
  };

  return categoryMap[category] ?? category;
}

/**
 * Map business type to display label
 */
export function mapBusinessType(type: string | null): string {
  if (!type) return 'Chưa xác định';

  const typeMap: Record<string, string> = {
    ONLINE: 'Online',
    OFFLINE: 'Offline',
    HYBRID: 'Kết hợp',
  };

  return typeMap[type] ?? type;
}

/**
 * Extract tag name from JSON field (supports LocalizedString or string)
 */
export function mapTagName(name: unknown): string {
  if (!name) return '';
  if (typeof name === 'string') return name;
  if (typeof name === 'object' && name !== null) {
    const localizedName = name as Record<string, string>;
    return localizedName['vi'] || localizedName['en'] || '';
  }
  return '';
}
