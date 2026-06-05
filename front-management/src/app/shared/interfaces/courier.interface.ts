import { APPROVAL_STATUS } from '@vhandelivery/shared-ui';

export interface Courier {
  [key: string]: unknown;
  readonly id: string;
  readonly name: string;
  readonly phone: string;
  readonly email: string;
  readonly vehicleType: string;
  readonly address: string;
  readonly ownerEmail: string;
  readonly ownerName: string;
  readonly initials: string;
  readonly initialsColor: string;
  readonly approvalStatus: 'pending' | 'approved' | 'rejected';
  readonly createdAt: string;
}

export function mapCourierApprovalStatus(
  status: string
): 'pending' | 'approved' | 'rejected' {
  const statusMap: Record<string, 'pending' | 'approved' | 'rejected'> = {
    [APPROVAL_STATUS.PENDING]: 'pending',
    [APPROVAL_STATUS.APPROVED]: 'approved',
    [APPROVAL_STATUS.REJECTED]: 'rejected',
  };
  return statusMap[status] ?? 'pending';
}
