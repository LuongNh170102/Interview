/**
 * Agency interface for DataTable display
 * Maps API response to UI display format
 */
export interface Agency {
  [key: string]: unknown;
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly initials: string;
  readonly initialsColor: string;
  readonly phone: string;
  readonly email: string;
  readonly address: string;
  readonly storeCount: number;
  readonly approvalStatus: 'pending' | 'approved' | 'rejected';
  readonly operationalStatus: 'active' | 'inactive' | 'suspended' | 'locked';
  readonly createdAt: string;
}

/**
 * Maps OperationalStatus from API to UI status
 */
export function mapOperationalStatusToUI(
  status: string
): 'active' | 'inactive' | 'suspended' | 'locked' {
  const statusMap: Record<
    string,
    'active' | 'inactive' | 'suspended' | 'locked'
  > = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    SUSPENDED: 'suspended',
    LOCKED: 'locked',
  };
  return statusMap[status] ?? 'inactive';
}

/**
 * Maps ApprovalStatus from API to UI status
 */
export function mapApprovalStatusToUI(
  status: string
): 'pending' | 'approved' | 'rejected' {
  const statusMap: Record<string, 'pending' | 'approved' | 'rejected'> = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
  };
  return statusMap[status] ?? 'pending';
}

/**
 * Generates initials from agency name
 */
export function generateInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word.charAt(0))
    .join('')
    .substring(0, 2)
    .toUpperCase();
}

/**
 * Generates a consistent color based on name hash
 */
export function generateInitialsColor(name: string): string {
  const colors = [
    '#D9F3F4',
    '#FFE3DC',
    '#FFF7D7',
    '#E7F7EC',
    '#E8E8FC',
    '#FCE8F4',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}
