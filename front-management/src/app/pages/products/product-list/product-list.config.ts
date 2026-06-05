import {
  TableConfig,
  TableHeaderConfig,
} from '../../../shared/interfaces/table.interface';
import { StatisticCardConfig } from '../../../shared/interfaces/statistic-card-config.interface';
import { ProductRow } from '../../../shared/interfaces/product.interface';

export interface ProductStatisticsView {
  totalPublished: number;
  totalDraft: number;
  totalOutOfStock: number;
}

export function createProductStatisticCards(
  stats: ProductStatisticsView,
  formatNumber: (value: number) => string
): StatisticCardConfig[] {
  return [
    {
      value: formatNumber(stats.totalPublished),
      labelKey: 'admin.productsPage.stats.published',
      icon: 'assets/icons/icon-stat-store.svg',
      variant: 'success',
    },
    {
      value: formatNumber(stats.totalDraft),
      labelKey: 'admin.productsPage.stats.draft',
      icon: 'assets/icons/icon-stat-bell.svg',
      variant: 'warning',
    },
    {
      value: formatNumber(stats.totalOutOfStock),
      labelKey: 'admin.productsPage.stats.outOfStock',
      icon: 'assets/icons/icon-stat-coin.svg',
      variant: 'error',
    },
  ];
}

export const PRODUCT_LIST_TABLE_CONFIG: TableConfig<ProductRow> = {
  id: 'products-table',
  columns: [
    {
      key: 'name',
      labelKey: 'admin.productsPage.table.product',
      type: 'custom',
      templateRef: 'productInfo',
      width: '280px',
    },
    {
      key: 'merchantName',
      labelKey: 'admin.productsPage.table.merchant',
      type: 'text',
    },
    {
      key: 'categoryName',
      labelKey: 'admin.productsPage.table.category',
      type: 'text',
    },
    {
      key: 'priceDisplay',
      labelKey: 'admin.productsPage.table.price',
      type: 'text',
      nowrap: true,
    },
    {
      key: 'stock',
      labelKey: 'admin.productsPage.table.stock',
      type: 'number',
      width: '100px',
      nowrap: true,
    },
    {
      key: 'productStatus',
      labelKey: 'admin.productsPage.table.status',
      type: 'status',
      statusConfig: {
        draft: {
          labelKey: 'admin.productsPage.status.draft',
          variant: 'warning',
        },
        published: {
          labelKey: 'admin.productsPage.status.published',
          variant: 'success',
        },
        archived: {
          labelKey: 'admin.productsPage.status.archived',
          variant: 'default',
        },
      },
    },
    {
      key: 'activeStatus',
      labelKey: 'admin.productsPage.table.visibility',
      type: 'status',
      statusConfig: {
        active: { labelKey: 'common.status.active', variant: 'success' },
        inactive: { labelKey: 'common.status.inactive', variant: 'default' },
      },
    },
    {
      key: 'createdAt',
      labelKey: 'admin.productsPage.table.createdAt',
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

export const PRODUCT_LIST_HEADER_CONFIG: TableHeaderConfig = {
  show: true,
  title: {
    labelKey: 'admin.productsPage.title',
    showCount: true,
  },
  search: {
    enabled: true,
    placeholderKey: 'admin.productsPage.searchPlaceholder',
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
    {
      id: 'add',
      labelKey: 'admin.productsPage.addNew',
      icon: 'assets/icons/icon-plus.svg',
      variant: 'primary',
      showOnMobile: true,
      showOnDesktop: true,
      mobileFlexGrow: true,
    },
  ],
};
