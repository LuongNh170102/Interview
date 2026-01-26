import {
  TableConfig,
  TableHeaderConfig,
} from '../../../shared/interfaces/table.interface';
import { Agency } from '../../../shared/interfaces/agency.interface';
import { StatisticCardConfig } from '../../../shared/interfaces/statistic-card-config.interface';

/**
 * Statistics data interface
 */
export interface AgencyStatistics {
  totalApproved: number;
  totalPending: number;
  totalActive: number;
}

/**
 * Generate statistic cards configuration from API data
 */
export function createStatisticCards(
  stats: AgencyStatistics,
  formatNumber: (value: number) => string
): StatisticCardConfig[] {
  return [
    {
      value: formatNumber(stats.totalApproved),
      labelKey: 'admin.partners.stats.totalAgencies',
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
      labelKey: 'admin.partners.stats.pendingApproval',
      icon: 'assets/icons/icon-stat-bell.svg',
      variant: 'error',
      subtitleKey: 'admin.partners.stats.needsProcessing',
    },
    {
      value: formatNumber(stats.totalActive),
      labelKey: 'admin.partners.stats.activeAgencies',
      icon: 'assets/icons/icon-stat-check.svg',
      variant: 'success',
      progress:
        stats.totalApproved > 0
          ? { current: stats.totalActive, total: stats.totalApproved }
          : undefined,
    },
    {
      value: '0 ₫',
      labelKey: 'admin.partners.stats.revenueFromAgencies',
      icon: 'assets/icons/icon-stat-coin.svg',
      variant: 'warning',
      subtitleKey: 'admin.partners.stats.currentMonthEstimate',
    },
  ];
}

/**
 * Table configuration for agencies list
 */
export const AGENCIES_TABLE_CONFIG: TableConfig<Agency> = {
  id: 'agencies-table',
  columns: [
    {
      key: 'name',
      labelKey: 'admin.partners.table.agencyName',
      type: 'custom',
      templateRef: 'storeInfo',
      width: '250px',
    },
    {
      key: 'phone',
      labelKey: 'admin.partners.table.phone',
      type: 'text',
    },
    {
      key: 'email',
      labelKey: 'admin.partners.table.email',
      type: 'text',
    },
    {
      key: 'address',
      labelKey: 'admin.partners.table.address',
      type: 'text',
    },
    {
      key: 'approvalStatus',
      labelKey: 'admin.partners.table.approvalStatus',
      type: 'status',
      statusConfig: {
        pending: { labelKey: 'common.status.pending', variant: 'warning' },
        approved: { labelKey: 'common.status.approved', variant: 'success' },
        rejected: { labelKey: 'common.status.rejected', variant: 'error' },
      },
    },
    {
      key: 'operationalStatus',
      labelKey: 'admin.partners.table.operationalStatus',
      type: 'status',
      statusConfig: {
        active: { labelKey: 'common.status.active', variant: 'success' },
        inactive: { labelKey: 'common.status.inactive', variant: 'default' },
        suspended: { labelKey: 'common.status.suspended', variant: 'info' },
        locked: { labelKey: 'common.status.locked', variant: 'error' },
      },
    },
    {
      key: 'createdAt',
      labelKey: 'admin.partners.table.createdAt',
      type: 'date',
      dateFormat: 'short',
      sortable: true,
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
 * Table header configuration for agencies list
 */
export const AGENCIES_TABLE_HEADER_CONFIG: TableHeaderConfig = {
  show: true,
  title: {
    labelKey: 'admin.partners.agencies.title',
    showCount: true,
  },
  search: {
    enabled: true,
    placeholderKey: 'admin.partners.agencies.searchPlaceholder',
    minWidth: '23.75rem',
  },
  filters: [
    {
      id: 'location',
      labelKey: 'admin.partners.filter.location',
      icon: 'assets/icons/icon-location-pin.svg',
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
    {
      id: 'add',
      labelKey: 'admin.partners.agencies.addNew',
      icon: 'assets/icons/icon-plus.svg',
      variant: 'primary',
      showOnMobile: true,
      showOnDesktop: true,
      mobileFlexGrow: true,
    },
  ],
};
