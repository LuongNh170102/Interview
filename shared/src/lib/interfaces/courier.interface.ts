import {
  ApprovalStatusValue,
  OperationalStatusValue,
} from '../constants/status.constant';

export interface CreateCourierRequest {
  name: string;
  phone: string;
  verificationToken: string;
  email?: string;
  vehicleType?: string;
}

export interface UpdateCourierRequest {
  name?: string;
  phone?: string;
  email?: string;
  vehicleType?: string;
  currentLocation?: Record<string, unknown>;
  status?: string;
  operationalStatus?: OperationalStatusValue;
  statusReason?: string;
}

export interface RejectCourierRequest {
  rejectionReason: string;
}

export interface CourierResponse {
  externalId: string;
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  status?: string | null;
  vehicleType?: string | null;
  currentLocation?: unknown;
  approvalStatus: ApprovalStatusValue;
  approvedAt?: string | Date | null;
  rejectedAt?: string | Date | null;
  rejectionReason?: string | null;
  operationalStatus: OperationalStatusValue;
  statusChangedAt?: string | Date | null;
  statusReason?: string | null;
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
  include?: string;
  approvalStatus?: ApprovalStatusValue;
  operationalStatus?: OperationalStatusValue;
  status?: string;
  search?: string;
}
