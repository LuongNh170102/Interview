import {
  TableConfig,
  TableHeaderConfig,
} from '../../../shared/interfaces/table.interface';
import { Courier } from '../../../shared/interfaces/courier.interface';
import { StatisticCardConfig } from '../../../shared/interfaces/statistic-card-config.interface';
import { CourierStatistics } from '@vhandelivery/shared-ui';

export function createCourierStatisticCards(
  stats: CourierStatistics,
  formatNumber: (value: number) => string
): StatisticCardConfig[] {
  return [
    {
      value: formatNumber(stats.totalPending),
      labelKey: 'admin.users.couriers.stats.pending',
      icon: 'assets/icons/icon-stat-bell.svg',
      variant: 'warning',
      subtitleKey: 'admin.partners.stats.needsProcessing',
      compact: true,
    },
    {
      value: formatNumber(stats.totalApproved),
      labelKey: 'admin.users.couriers.stats.approved',
      icon: 'assets/icons/icon-stat-check.svg',
      variant: 'success',
      compact: true,
    },
    {
      value: formatNumber(stats.totalActive),
      labelKey: 'admin.users.couriers.stats.active',
      icon: 'assets/icons/icon-stat-store.svg',
      variant: 'primary',
      compact: true,
    },
  ];
}

const APPROVE_ICON =
  '<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />';
const REJECT_ICON =
  '<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />';

export const COURIERS_TABLE_CONFIG: TableConfig<Courier> = {
  id: 'couriers-table',
  columns: [
    {
      key: 'name',
      labelKey: 'admin.users.couriers.table.name',
      type: 'custom',
      templateRef: 'courierInfo',
      width: '240px',
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
      key: 'vehicleType',
      labelKey: 'admin.users.couriers.table.vehicleType',
      type: 'text',
    },
    {
      key: 'address',
      labelKey: 'admin.users.couriers.table.address',
      type: 'text',
    },
    {
      key: 'createdAt',
      labelKey: 'admin.users.couriers.table.registeredAt',
      type: 'date',
    },
    {
      key: 'approvalStatus',
      labelKey: 'admin.users.couriers.table.status',
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
  ],
  actions: [
    {
      id: 'approve',
      labelKey: 'admin.users.couriers.actions.approve',
      icon: 'custom',
      customIcon: APPROVE_ICON,
      variant: 'success',
      visible: (row) => row.approvalStatus === 'pending',
    },
    {
      id: 'reject',
      labelKey: 'admin.users.couriers.actions.reject',
      icon: 'custom',
      customIcon: REJECT_ICON,
      variant: 'danger',
      visible: (row) => row.approvalStatus === 'pending',
    },
  ],
  hoverable: true,
  rowIdKey: 'id',
  paginationItemsLabelKey: 'admin.users.couriers.pagination.items',
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
    minWidth: '14rem',
  },
  filters: [
    {
      id: 'status',
      labelKey: 'admin.partners.filter.status',
      type: 'dropdown',
      options: [
        { value: '', labelKey: 'admin.users.couriers.filter.all' },
        { value: 'PENDING', labelKey: 'common.status.pending' },
        { value: 'APPROVED', labelKey: 'common.status.approved' },
        { value: 'REJECTED', labelKey: 'common.status.rejected' },
      ],
    },
  ],
  actions: [],
};
