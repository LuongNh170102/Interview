import {
  ApprovalStatusValue,
  OperationalStatusValue,
} from '../constants/status.constant';

export interface CourierUserInfo {
  email: string;
  username: string | null;
  phone: string | null;
}

export interface CourierResponse {
  externalId: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  vehicleType: string | null;
  approvalStatus: ApprovalStatusValue;
  operationalStatus: OperationalStatusValue;
  availabilityStatus: string;
  createdAt: string | Date;
  updatedAt?: string | Date | null;
  user?: CourierUserInfo | null;
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
  availabilityStatus?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export interface RejectCourierRequest {
  rejectionReason: string;
}
