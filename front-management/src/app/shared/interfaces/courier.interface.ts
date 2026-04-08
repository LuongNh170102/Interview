import { ApprovalStatus } from '../types/approval-status.type';

export interface CourierResponse {
  externalId: string;
  name: string;
  phone: string;
  email: string;
  vehicleType: string | null;
  licenseNumber: string | null;
  avatarUrl: string | null;
  address: string | null;
  onlineStatus: string;
  approvalStatus: ApprovalStatus;
  approvedAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface CourierListResponse {
  data: CourierResponse[];
  total: number;
  page: number;
  limit: number;
  statistics?: {
    totalPending: number;
    totalApproved: number;
    totalRejected: number;
  };
}

/** UI display model — maps API fields to what the template needs */
export interface Courier {
  readonly id: string;
  readonly name: string;
  readonly phone: string;
  readonly email: string;
  readonly vehicleType: string;
  readonly approvalStatus: 'pending' | 'approved' | 'rejected';
  readonly rejectionReason: string | null;
  readonly registeredAt: string;
}
