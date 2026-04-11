export interface CourierQueryParams {
  page?: number;
  limit?: number;
  include?: string;
  approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  search?: string;
}

export interface CourierResponse {
  externalId: string;
  fullName: string;
  phone: string;
  email?: string;
  vehicleType?: string;
  vehiclePlate?: string;
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  operationalStatus: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CourierListResponse {
  data: CourierResponse[];
  total: number;
  page: number;
  limit: number;
  statistics?: {
    totalPending: number;
    totalApproved: number;
    totalActive: number;
  };
}

export interface CreateCourierRequest {
  fullName: string;
  phone: string;
  email?: string;
  vehicleType?: string;
  vehiclePlate?: string;
  // verificationToken sẽ được gửi từ OTP flow
  verificationToken?: string;
}

export interface UpdateCourierStatusRequest {
  status: 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
}
