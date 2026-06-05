import {
  TableConfig,
  TableHeaderConfig,
} from '../../../shared/interfaces/table.interface';
import { StatisticCardConfig } from '../../../shared/interfaces/statistic-card-config.interface';
import { Courier } from '../../../shared/interfaces/courier.interface';

export interface CourierStatistics {
  totalApproved: number;
  totalPending: number;
  totalOnline: number;
}

export function createCourierStatisticCards(
  stats: CourierStatistics,
  formatNumber: (value: number) => string
): StatisticCardConfig[] {
  return [
    {
      value: formatNumber(stats.totalPending),
      labelKey: 'admin.users.couriers.stats.pendingApproval',
      icon: 'assets/icons/icon-stat-bell.svg',
      variant: 'error',
      subtitleKey: 'admin.users.couriers.stats.requiresReview',
    },
    {
      value: formatNumber(stats.totalApproved),
      labelKey: 'admin.users.couriers.stats.approvedCouriers',
      icon: 'assets/icons/icon-stat-check.svg',
      variant: 'success',
    },
    {
      value: formatNumber(stats.totalOnline),
      labelKey: 'admin.users.couriers.stats.onlineCouriers',
      icon: 'assets/icons/icon-stat-store.svg',
      variant: 'primary',
      progress:
        stats.totalApproved > 0
          ? { current: stats.totalOnline, total: stats.totalApproved }
          : undefined,
    },
  ];
}

export const COURIERS_TABLE_CONFIG: TableConfig<Courier> = {
  id: 'couriers-table',
  columns: [
    {
      key: 'name',
      labelKey: 'admin.users.couriers.table.courier',
      type: 'custom',
      templateRef: 'courierInfo',
      width: '260px',
    },
    {
      key: 'phone',
      labelKey: 'admin.users.couriers.table.phone',
      type: 'text',
      nowrap: true,
    },
    {
      key: 'vehicleType',
      labelKey: 'admin.users.couriers.table.vehicleType',
      type: 'text',
    },
    {
      key: 'availabilityStatus',
      labelKey: 'admin.users.couriers.table.availability',
      type: 'status',
      statusConfig: {
        offline: {
          labelKey: 'admin.users.couriers.availability.offline',
          variant: 'default',
        },
        online: {
          labelKey: 'admin.users.couriers.availability.online',
          variant: 'success',
        },
        busy: {
          labelKey: 'admin.users.couriers.availability.busy',
          variant: 'warning',
        },
      },
    },
    {
      key: 'approvalStatus',
      labelKey: 'admin.users.couriers.table.approvalStatus',
      type: 'status',
      statusConfig: {
        pending: {
          labelKey: 'common.status.pending',
          variant: 'warning',
        },
        approved: {
          labelKey: 'common.status.approved',
          variant: 'success',
        },
        rejected: {
          labelKey: 'common.status.rejected',
          variant: 'error',
        },
      },
    },
    {
      key: 'orderCount',
      labelKey: 'admin.users.couriers.table.orders',
      type: 'number',
      width: '100px',
      nowrap: true,
    },
    {
      key: 'createdAt',
      labelKey: 'admin.users.couriers.table.createdAt',
      type: 'date',
      dateFormat: 'short',
      sortable: true,
    },
    {
      key: 'approvalActions',
      labelKey: 'admin.users.couriers.table.actions',
      type: 'custom',
      templateRef: 'approvalActions',
      width: '220px',
    },
  ],
  hoverable: true,
  rowIdKey: 'id',
};

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
  actions: [
    {
      id: 'column',
      labelKey: 'admin.partners.column',
      icon: 'assets/icons/icon-column.svg',
      variant: 'outline',
      showOnMobile: true,
      showOnDesktop: true,
    },
  ],
};
