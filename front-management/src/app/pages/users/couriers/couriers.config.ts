import {
  TableConfig,
  TableHeaderConfig,
} from '../../../shared/interfaces/table.interface';
import { Courier } from '../../../shared/interfaces/courier.interface';
import { StatisticCardConfig } from '../../../shared/interfaces/statistic-card-config.interface';

/**
 * Statistics data interface for couriers
 */
export interface CourierStatistics {
  totalApproved: number;
  totalPending: number;
  totalActive: number;
}

/**
 * Generate statistic cards configuration from API data
 */
export function createCourierStatisticCards(
  stats: CourierStatistics,
  formatNumber: (value: number) => string
): StatisticCardConfig[] {
  return [
    {
      value: formatNumber(stats.totalApproved),
      labelKey: 'admin.users.couriers.stats.totalCouriers',
      icon: 'assets/icons/icon-stat-store.svg',
      variant: 'primary',
      trend: {
        value: '+12.5%',
        direction: 'up',
        labelKey: 'admin.partners.stats.comparedToLastMonth',
      },
    },
    {
      value: formatNumber(stats.totalPending),
      labelKey: 'admin.users.couriers.stats.pendingApproval',
      icon: 'assets/icons/icon-stat-bell.svg',
      variant: 'error',
      subtitleKey: 'admin.partners.stats.needsProcessing',
    },
    {
      value: formatNumber(stats.totalActive),
      labelKey: 'admin.users.couriers.stats.activeCouriers',
      icon: 'assets/icons/icon-stat-check.svg',
      variant: 'success',
      progress:
        stats.totalApproved > 0
          ? { current: stats.totalActive, total: stats.totalApproved }
          : undefined,
    }
  ];
}

/**
 * Table configuration for couriers list
 */
export const COURIERS_TABLE_CONFIG: TableConfig<Courier> = {
  id: 'couriers-table',
  columns: [
    {
      key: 'name',
      labelKey: 'admin.users.couriers.table.name',
      type: 'custom',
      templateRef: 'courierInfo',
      width: '280px',
    },
    {
      key: 'phone',
      labelKey: 'admin.users.couriers.table.phone',
      type: 'text',
      nowrap: true,
    },
    {
      key: 'email',
      labelKey: 'admin.users.couriers.table.email',
      type: 'text',
    },
    {
      key: 'rejectionReason',
      labelKey: 'admin.users.couriers.table.rejectionReason',
      type: 'text',
    },
    {
      key: 'rejectedAt',
      labelKey: 'admin.users.couriers.table.rejectedAt',
      type: 'date',
    },
    {
      key: 'deletedAt',
      labelKey: 'admin.users.couriers.table.deletedAt',
      type: 'date',
    },
    {
      key: 'vehiclePlate',
      labelKey: 'admin.users.couriers.table.vehiclePlate',
      type: 'text',
      nowrap: true,
    },
    {
      key: 'vehicleType',
      labelKey: 'admin.users.couriers.table.vehicleType',
      type: 'text',
    },
    {
      key: 'currentLocation',
      labelKey: 'admin.users.couriers.table.currentLocation',
      type: 'text',
    },
    {
      key: 'approvalStatus',
      labelKey: 'admin.users.couriers.table.approvalStatus',
      type: 'status',
      statusConfig: {
        PENDING: { labelKey: 'common.status.pending', variant: 'warning' },
        APPROVED: { labelKey: 'common.status.approved', variant: 'success' },
        REJECTED: { labelKey: 'common.status.rejected', variant: 'error' },
      },
    },
    {
      key: 'activeStatus',
      labelKey: 'admin.users.couriers.table.activeStatus',
      type: 'status',
      statusConfig: {
        AVAILABLE: { labelKey: 'common.status.active', variant: 'success' },
        BUSY: { labelKey: 'common.status.busy', variant: 'warning' },
        OFFLINE: { labelKey: 'common.status.inactive', variant: 'default' },
      },
    },
  ],
  actions: [
    {
      id: 'menu',
      labelKey: 'common.actions',
      icon: 'more',
      variant: 'default',
    },
  ],
  hoverable: true,
  rowIdKey: 'id',
};

/**
 * Table header configuration for couriers list
 */
export const COURIERS_TABLE_HEADER_CONFIG: TableHeaderConfig = {
  show: true,
  title: {
    labelKey: 'admin.users.couriers.title',
    showCount: true,
  },
  search: {
    enabled: true,
    placeholderKey: 'admin.users.couriers.searchPlaceholder',
    minWidth: '23.75rem',
  },
  filters: [
    {
      id: 'approvalStatus',
      labelKey: 'admin.users.filter.approvalStatus',
      type: 'dropdown',
      placeholderKey: 'admin.users.filter.approvalStatus',
      options: [
        { value: 'PENDING', labelKey: 'common.status.pending' },
        { value: 'APPROVED', labelKey: 'common.status.approved' },
        { value: 'REJECTED', labelKey: 'common.status.rejected' },
      ],
    },
    {
      id: 'activeStatus',
      labelKey: 'admin.users.filter.activeStatus',
      type: 'dropdown',
      placeholderKey: 'admin.users.filter.activeStatus',
      options: [
        { value: 'AVAILABLE', labelKey: 'common.status.active' },
        { value: 'BUSY', labelKey: 'common.status.busy' },
        { value: 'OFFLINE', labelKey: 'common.status.inactive' },
      ],
    },
    {
      id: 'startDate',
      labelKey: 'admin.users.filter.startDate',
      type: 'date',
    },
    {
      id: 'endDate',
      labelKey: 'admin.users.filter.endDate',
      type: 'date',
    },
  ],
  actions: [
    {
      id: 'column',
      labelKey: 'admin.partners.column',
      icon: 'assets/icons/icon-column.svg',
      variant: 'outline',
      showOnMobile: true,
      showOnDesktop: true,
    }
  ],
};
