import {
  TableConfig,
  TableHeaderConfig,
} from '../../../shared/interfaces/table.interface';
import { CourierResponse } from '@vhandelivery/shared-ui';
import { StatisticCardConfig } from '../../../shared/interfaces/statistic-card-config.interface';

export interface CourierStatistics {
  totalApproved: number;
  totalPending: number;
  totalActive: number;
}

export function createStatisticCards(
  stats: CourierStatistics,
  formatNumber: (value: number) => string
): StatisticCardConfig[] {
  return [
    {
      value: formatNumber(stats.totalApproved),
      labelKey: 'admin.partners.couriers.stats.totalCouriers',
      icon: 'assets/icons/icon-stat-store.svg',
      variant: 'primary',
    },
    {
      value: formatNumber(stats.totalPending),
      labelKey: 'admin.partners.couriers.stats.pendingApproval',
      icon: 'assets/icons/icon-stat-bell.svg',
      variant: 'error',
      subtitleKey: 'admin.partners.stats.needsProcessing',
    },
    {
      value: formatNumber(stats.totalActive),
      labelKey: 'admin.partners.couriers.stats.activeCouriers',
      icon: 'assets/icons/icon-stat-check.svg',
      variant: 'success',
      progress:
        stats.totalApproved > 0
          ? { current: stats.totalActive, total: stats.totalApproved }
          : undefined,
    },
  ];
}

export const COURIERS_TABLE_CONFIG: TableConfig<CourierResponse> = {
  id: 'couriers-table',
  columns: [
    {
      key: 'name',
      labelKey: 'admin.partners.couriers.table.name',
      type: 'custom',
      templateRef: 'courierInfo',
      width: '250px',
    },
    {
      key: 'phone',
      labelKey: 'admin.partners.couriers.table.phone',
      type: 'text',
    },
    {
      key: 'vehicleType',
      labelKey: 'admin.partners.couriers.table.vehicleType',
      type: 'text',
    },
    {
      key: 'status',
      labelKey: 'admin.partners.couriers.table.status',
      type: 'status',
      statusConfig: {
        available: { labelKey: 'common.status.active', variant: 'success' },
        busy: { labelKey: 'common.status.suspended', variant: 'warning' },
        offline: { labelKey: 'common.status.inactive', variant: 'default' },
      },
    },
    {
      key: 'approvalStatus',
      labelKey: 'admin.partners.couriers.table.approvalStatus',
      type: 'status',
      statusConfig: {
        approved: { labelKey: 'common.status.approved', variant: 'success' },
        pending: { labelKey: 'common.status.pending', variant: 'warning' },
        rejected: { labelKey: 'common.status.rejected', variant: 'error' },
        APPROVED: { labelKey: 'common.status.approved', variant: 'success' },
        PENDING: { labelKey: 'common.status.pending', variant: 'warning' },
        REJECTED: { labelKey: 'common.status.rejected', variant: 'error' },
      },
    },
    {
      key: 'createdAt',
      labelKey: 'admin.partners.couriers.table.createdAt',
      type: 'date',
      dateFormat: 'short',
      sortable: true,
    },
  ],
  actions: [
    {
      id: 'approve',
      labelKey: 'common.status.approved',
      icon: 'activate',
      variant: 'success',
    },
    {
      id: 'reject',
      labelKey: 'common.status.rejected',
      icon: 'deactivate',
      variant: 'danger',
    },
  ],
  hoverable: true,
  rowIdKey: 'id',
};

export const COURIERS_TABLE_HEADER_CONFIG: TableHeaderConfig = {
  show: true,
  title: {
    labelKey: 'admin.partners.couriers.title',
    showCount: true,
  },
  search: {
    enabled: true,
    placeholderKey: 'admin.partners.couriers.searchPlaceholder',
    minWidth: '23.75rem',
  },
  filters: [
    {
      id: 'approvalStatus',
      labelKey: 'admin.partners.filter.status',
      type: 'button',
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
    },
  ],
};
