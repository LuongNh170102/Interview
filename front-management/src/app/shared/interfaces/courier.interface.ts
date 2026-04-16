import {
  COURIER_ACTIVE_STATUS,
  APPROVAL_STATUS,
  COURIER_APPROVAL_STATUS,
  COURIER_ACTIVE_STATUS_TYPE,
  ApprovalStatus,
  CourierActiveStatus
} from '@vhandelivery/shared-ui';

/**
 * Courier interface for DataTable display
 * Maps API response to UI display format
 */
export interface Courier {
  [key: string]: unknown;
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly initials: string;
  readonly initialsColor: string;
  readonly phone: string;
  readonly email: string;
  readonly rejectionReason: string
  readonly rejectedAt: string
  readonly approvedAt: string
  readonly deletedAt: string
  readonly vehiclePlate: string
  readonly vehicleType: string
  readonly currentLocation: string

  readonly approvalStatus: COURIER_APPROVAL_STATUS;
  readonly activeStatus: COURIER_ACTIVE_STATUS_TYPE;

  readonly createdAt: string;
}

/**
 * Courier response from API (before mapping)
 */
export interface CourierApiResponse {
  externalId: string;
  name: string;
  phone: string;
  email: string | null;
  rejectionReason: string | null
  rejectedAt: string | null
  approvedAt: string | null

  deletedAt: string | null
  vehiclePlate: string
  vehicleType: string
  currentLocation: string | null

  approvalStatus: string;
  activeStatus: string

  createdAt: string;
  updatedAt: string | null
}

/**
 * Statistics for couriers
 */
export interface CourierStatistics {
  totalApproved: number;
  totalPending: number;
  totalActive: number;
}

/**
 * List response from API with pagination and optional statistics
 */
export interface CourierListResponse {
  data: CourierApiResponse[];
  total: number;
  page: number;
  limit: number;
  statistics?: CourierStatistics;
}

/**
 * Query parameters for couriers API
 */
export interface CourierQueryParams {
  page?: number;
  limit?: number;
  include?: string;
  approvalStatus?: ApprovalStatus;
  activeStatus?: CourierActiveStatus;
  startDate?: string
  endDate?: string
}

/**
 * Maps ActiveStatus from API (returns as-is since database uses UPPERCASE)
 */
export function mapCourierActiveStatus(
  status: string
): COURIER_ACTIVE_STATUS_TYPE {
  const statusMap: Record<string, COURIER_ACTIVE_STATUS_TYPE> = {
    [COURIER_ACTIVE_STATUS.AVAILABLE]: COURIER_ACTIVE_STATUS.AVAILABLE,
    [COURIER_ACTIVE_STATUS.BUSY]: COURIER_ACTIVE_STATUS.BUSY,
    [COURIER_ACTIVE_STATUS.OFFLINE]: COURIER_ACTIVE_STATUS.OFFLINE,
  };
  return statusMap[status] ?? COURIER_ACTIVE_STATUS.OFFLINE;
}

/**
 * Maps ApprovalStatus from API to UI status
 */
export function mapCourierApprovalStatus(
  status: string
): COURIER_APPROVAL_STATUS {
  const statusMap: Record<string, COURIER_APPROVAL_STATUS> = {
    [APPROVAL_STATUS.PENDING]: APPROVAL_STATUS.PENDING,
    [APPROVAL_STATUS.APPROVED]: APPROVAL_STATUS.APPROVED,
    [APPROVAL_STATUS.REJECTED]: APPROVAL_STATUS.REJECTED,
  };
  return statusMap[status] ?? APPROVAL_STATUS.PENDING;
}

/**
 * Generate initials from courier name (first 2 characters of first word)
 */
export function generateCourierInitials(name: string): string {
  if (!name) return '??';
  const words = name.trim().split(' ');
  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }
  return (words[0][0] + words[1][0]).toUpperCase();
}

/**
 * Generate a consistent color based on courier name
 */
export function generateCourierInitialsColor(name: string): string {
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