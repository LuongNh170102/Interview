/**
 * Courier model for display in the UI
 */
export interface Courier {
  externalId: string;
  name: string;
  phone: string;
  email: string;
  vehicleType: string;
  vehicleNumber: string;
  approvalStatus: string;
  operationalStatus: string;
  createdAt: string;

  // Approval info
  approvedByUser?: { email: string; username: string | null } | null;
  rejectedByUser?: { email: string; username: string | null } | null;
}

/**
 * Statistics for couriers
 */
export interface CourierStatistics {
  totalApproved: number;
  totalPending: number;
  totalRejected: number;
  totalActive: number;
}

/**
 * API response types
 */
export interface CourierApiResponse {
  externalId: string;
  userId: number;
  name: string | null;
  phone: string | null;
  status: string | null;
  vehicleType: string | null;
  vehicleNumber: string | null;
  approvalStatus: string;
  operationalStatus: string;
  createdAt: string;

  user?: {
    email: string;
    username: string | null;
    phone: string | null;
  } | null;

  approvedByUser?: {
    email: string;
    username: string | null;
  } | null;

  rejectedByUser?: {
    email: string;
    username: string | null;
  } | null;
}

/**
 * List response from API
 */
export interface CourierListResponse {
  data: CourierApiResponse[];
  total: number;
  page: number;
  limit: number;
  statistics?: CourierStatistics;
}
