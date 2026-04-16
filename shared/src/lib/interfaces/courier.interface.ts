import {
    ApprovalStatusValue,
    CourierActiveStatusValue,
} from '../constants/status.constant';

export interface CreateCourierRequest {
    name: string;
    phone: string;
    email?: string;
    vehicleType: string
    vehiclePlate: string
    verificationToken: string;
}

export interface CourierResponse {
    externalId: string;
    name: string;
    phone: string;
    email: string | null;
    approvalStatus: ApprovalStatus;
    approvedAt: string | null;
    rejectedAt: string | null;
    rejectionReason: string | null;
    activeStatus: CourierActiveStatus;
    statusChangedAt: string | null;
    vehicleType: string;
    vehiclePlate: string;
    currentLocation: string | null
    createdAt: string;
    updatedAt: string | null;
    deletedAt: string | null;

}

type ApprovalStatus = ApprovalStatusValue;
export type CourierActiveStatus = CourierActiveStatusValue;

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
    approvalStatus?: ApprovalStatus;
    activeStatus?: CourierActiveStatus;
    startDate?: string
    endDate?: string
    search?: string
}

export interface UpdateCourierStatus {
    rejectionReason?: string
    status: ApprovalStatus
}