export type CourierApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

/**
 * Operational Status for Courier
 * Matches Prisma enum OperationalStatus in backend
 */
export type CourierOperationalStatus =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'SUSPENDED'
  | 'LOCKED';

/**
 * Combined Courier Status (for UI display and filtering)
 */
export type CourierStatus = CourierApprovalStatus | CourierOperationalStatus;

/**
 * Mapping from backend status to user-friendly label keys (for translation)
 */
export const COURIER_APPROVAL_STATUS_LABEL: Record<
  CourierApprovalStatus,
  string
> = {
  PENDING: 'common.status.pending',
  APPROVED: 'common.status.approved',
  REJECTED: 'common.status.rejected',
} as const;

/**
 * Mapping from backend status to UI color variant
 */
export const COURIER_APPROVAL_STATUS_VARIANT: Record<
  CourierApprovalStatus,
  'warning' | 'success' | 'error'
> = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'error',
} as const;

/**
 * Helper function to check if courier is active/operable
 */
export function isCourierOperational(
  status: CourierOperationalStatus
): boolean {
  return status === 'ACTIVE';
}

/**
 * Helper function to check if courier can receive orders
 */
export function canCourierReceiveOrders(courier: {
  approvalStatus: CourierApprovalStatus;
  operationalStatus: CourierOperationalStatus;
}): boolean {
  return (
    courier.approvalStatus === 'APPROVED' &&
    courier.operationalStatus === 'ACTIVE'
  );
}
