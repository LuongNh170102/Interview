export interface CreateAgencyRequest {
  name: string;
  phone: string;
  verificationToken: string;
  taxCode?: string;
  bankAccount?: string;
  address?: string;
  email?: string;
  logo?: string;
  businessLicenseUrl?: string;
}

export interface AgencyResponse {
  externalId: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  taxCode?: string | null;
  bankAccount?: string | null;
  address?: string | null;
  logo?: string | null;
  businessLicenseUrl?: string | null;
  approvalStatus: ApprovalStatus;
  approvedAt?: string | Date | null;
  rejectedAt?: string | Date | null;
  rejectionReason?: string | null;
  operationalStatus: OperationalStatus;
  statusChangedAt?: string | Date | null;
  statusReason?: string | null;
  createdAt: string | Date;
  updatedAt?: string | Date | null;
}

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type OperationalStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'LOCKED';

export interface AgencyStatistics {
  totalApproved: number;
  totalPending: number;
  totalActive: number;
}

export interface AgencyListResponse {
  data: AgencyResponse[];
  total: number;
  page: number;
  limit: number;
  statistics?: AgencyStatistics;
}

export interface AgencyQueryParams {
  page?: number;
  limit?: number;
  include?: string;
  approvalStatus?: ApprovalStatus;
}
