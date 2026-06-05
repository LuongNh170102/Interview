import {
  APPROVAL_STATUS,
  COURIER_AVAILABILITY_STATUS,
  CourierResponse,
  OPERATIONAL_STATUS,
} from '@vhandelivery/shared-ui';

export interface Courier {
  [key: string]: unknown;
  readonly id: string;
  readonly name: string;
  readonly code: string;
  readonly initials: string;
  readonly initialsColor: string;
  readonly email: string;
  readonly phone: string;
  readonly vehicleType: string;
  readonly approvalStatus: 'pending' | 'approved' | 'rejected';
  readonly operationalStatus: 'active' | 'inactive' | 'suspended' | 'locked';
  readonly availabilityStatus: 'offline' | 'online' | 'busy';
  readonly rejectionReason: string;
  readonly orderCount: number;
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

export function mapCourierOperationalStatus(
  status: string
): 'active' | 'inactive' | 'suspended' | 'locked' {
  const statusMap: Record<
    string,
    'active' | 'inactive' | 'suspended' | 'locked'
  > = {
    [OPERATIONAL_STATUS.ACTIVE]: 'active',
    [OPERATIONAL_STATUS.INACTIVE]: 'inactive',
    [OPERATIONAL_STATUS.SUSPENDED]: 'suspended',
    [OPERATIONAL_STATUS.LOCKED]: 'locked',
  };

  return statusMap[status] ?? 'inactive';
}

export function mapCourierAvailabilityStatus(
  status: string
): 'offline' | 'online' | 'busy' {
  const statusMap: Record<string, 'offline' | 'online' | 'busy'> = {
    [COURIER_AVAILABILITY_STATUS.OFFLINE]: 'offline',
    [COURIER_AVAILABILITY_STATUS.ONLINE]: 'online',
    [COURIER_AVAILABILITY_STATUS.BUSY]: 'busy',
  };

  return statusMap[status] ?? 'offline';
}

export function generateCourierInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) {
    return '??';
  }

  const words = trimmed.split(' ');
  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }

  return (words[0][0] + words[1][0]).toUpperCase();
}

export function generateCourierInitialsColor(name: string): string {
  const colors = ['#D9F3F4', '#FFE3DC', '#FFF7D7', '#E7F7EC', '#E8E8FC'];
  let hash = 0;

  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}

export function mapCourierToRow(item: CourierResponse): Courier {
  const displayName =
    item.name ?? item.user?.username ?? item.user?.email ?? 'N/A';

  return {
    id: item.externalId,
    code: item.externalId.toUpperCase(),
    name: displayName,
    initials: generateCourierInitials(displayName),
    initialsColor: generateCourierInitialsColor(displayName),
    email: item.user?.email ?? '',
    phone: item.phone ?? item.user?.phone ?? '',
    vehicleType: item.vehicleType ?? 'N/A',
    approvalStatus: mapCourierApprovalStatus(item.approvalStatus),
    operationalStatus: mapCourierOperationalStatus(item.operationalStatus),
    availabilityStatus: mapCourierAvailabilityStatus(item.status),
    rejectionReason: item.rejectionReason ?? '',
    orderCount: item.orderCount,
    createdAt: item.createdAt,
  };
}
