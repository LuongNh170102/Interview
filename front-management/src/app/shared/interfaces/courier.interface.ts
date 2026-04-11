export interface Courier {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  vehicleType?: string;
  vehiclePlate?: string;
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  operationalStatus: string;
  createdAt: string;
  initials: string;
  initialsColor: string;
}

export interface CourierListResponse {
  data: any[];
  total: number;
  page: number;
  limit: number;
  statistics?: {
    totalPending: number;
    totalApproved: number;
    totalActive: number;
  };
}

export interface CourierStatistics {
  totalPending: number;
  totalApproved: number;
  totalActive: number;
}

export function mapCourierToUI(apiCourier: any): Courier {
  return {
    id: apiCourier.externalId,
    fullName: apiCourier.fullName,
    phone: apiCourier.phone,
    email: apiCourier.email,
    vehicleType: apiCourier.vehicleType,
    vehiclePlate: apiCourier.vehiclePlate,
    approvalStatus: apiCourier.approvalStatus,
    operationalStatus: apiCourier.operationalStatus,
    createdAt: apiCourier.createdAt,
    initials: generateInitials(apiCourier.fullName),
    initialsColor: generateInitialsColor(apiCourier.fullName),
  };
}

export function generateInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function generateInitialsColor(name: string): string {
  const colors = ['#D9F3F4', '#FFE3DC', '#FFF7D7', '#E7F7EC'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function createCourierStatisticCards(stats: any) {
  return [
    {
      value: stats.totalPending || 0,
      labelKey: 'admin.couriers.stats.pending',
      icon: 'assets/icons/icon-stat-bell.svg',
      variant: 'warning' as const,
    },
    {
      value: stats.totalApproved || 0,
      labelKey: 'admin.couriers.stats.approved',
      icon: 'assets/icons/icon-stat-check.svg',
      variant: 'success' as const,
    },
    {
      value: stats.totalActive || 0,
      labelKey: 'admin.couriers.stats.active',
      icon: 'assets/icons/icon-stat-store.svg',
      variant: 'primary' as const,
    },
  ];
}
