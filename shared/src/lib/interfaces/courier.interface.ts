import {
  ApprovalStatus,
} from '../constants/status.constant';

export interface CreateCourierRequest {
  name: string;
  phone: string;
  verificationToken: string;
  vehicleType?: string;
}

export interface CourierResponse {
  id: number;
  userId: number;
  name?: string | null;
  phone?: string | null;
  status?: string | null;
  vehicleType?: string | null;
  currentLocation?: any | null;
  approvalStatus: ApprovalStatus;
  approvedAt?: string | Date | null;
  approvedBy?: number | null;
  rejectedAt?: string | Date | null;
  rejectedBy?: number | null;
  rejectionReason?: string | null;
  createdAt: string | Date;
  updatedAt?: string | Date | null;
}

export interface CourierStatistics {
  totalApproved: number;
  totalPending: number;
  totalActive: number;
}

export interface CourierListResponse {
  data: CourierResponse[];
  total: number;
  page: number;
  limit: number;
  statistics?: CourierStatistics;
}

export interface CourierQueryParams {
  page?: number;
  limit?: number;
  shouldIncludeStatistics?: boolean;
  approvalStatus?: string;
  operationalStatus?: string;
  search?: string;
}
