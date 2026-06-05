import {
  ApprovalStatusValue,
  CourierAvailabilityStatusValue,
  OperationalStatusValue,
} from '../constants/status.constant';

export interface CourierLocation {
  lat: number;
  lng: number;
}

export interface CourierUserInfo {
  externalId: string;
  email: string | null;
  username: string | null;
  phone: string | null;
}

export interface CourierResponse {
  externalId: string;
  name: string | null;
  phone: string | null;
  vehicleType: string | null;
  status: CourierAvailabilityStatusValue;
  approvalStatus: ApprovalStatusValue;
  operationalStatus: OperationalStatusValue;
  rejectionReason: string | null;
  currentLocation: CourierLocation | null;
  createdAt: string;
  updatedAt: string | null;
  user: CourierUserInfo | null;
  orderCount: number;
}

export interface CourierStatistics {
  totalApproved: number;
  totalPending: number;
  totalOnline: number;
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
  status?: CourierAvailabilityStatusValue;
  search?: string;
  userId?: number;
}

export interface RegisterCourierRequest {
  name?: string;
  phone: string;
  vehicleType?: string;
  currentLocation?: CourierLocation;
  verificationToken: string;
}

export interface UpdateCourierApprovalRequest {
  status: ApprovalStatusValue;
  rejectionReason?: string;
  statusReason?: string;
}

export interface UpdateCourierAvailabilityRequest {
  status?: CourierAvailabilityStatusValue;
  currentLocation?: CourierLocation;
  vehicleType?: string;
  name?: string;
  phone?: string;
}
