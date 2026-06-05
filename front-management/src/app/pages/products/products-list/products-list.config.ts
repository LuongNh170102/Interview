import { TableConfig, TableHeaderConfig } from '../../../shared/interfaces/table.interface';

export interface ProductRow {
  [key: string]: unknown;
  id: string;
  name: string;
  sku: string;
  price: string;
  stock: number;
  publishStatus: string;
  statusLabel: string;
  createdAt: string;
}

export const PRODUCTS_TABLE_CONFIG: TableConfig<ProductRow> = {
  id: 'products-table',
  columns: [
    {
      key: 'name',
      labelKey: 'admin.products.table.name',
      type: 'custom',
      templateRef: 'productInfo',
      width: '260px',
    },
    {
      key: 'sku',
      labelKey: 'admin.products.table.sku',
      type: 'text',
      nowrap: true,
      visible: false,
    },
    {
      key: 'price',
      labelKey: 'admin.products.table.price',
      type: 'text',
      nowrap: true,
    },
    {
      key: 'stock',
      labelKey: 'admin.products.table.stock',
      type: 'text',
      nowrap: true,
    },
    {
      key: 'statusLabel',
      labelKey: 'admin.products.table.status',
      type: 'text',
    },
    {
      key: 'createdAt',
      labelKey: 'admin.products.table.createdAt',
      type: 'date',
    },
  ],
  actions: [
    {
      id: 'edit',
      labelKey: 'admin.products.actions.edit',
      icon: 'edit',
      variant: 'primary',
    },
    {
      id: 'delete',
      labelKey: 'admin.products.actions.delete',
      icon: 'delete',
      variant: 'danger',
    },
  ],
  hoverable: true,
  rowIdKey: 'id',
  paginationItemsLabelKey: 'admin.products.pagination.items',
};

export const PRODUCTS_TABLE_HEADER_CONFIG: TableHeaderConfig = {
  show: true,
  title: {
    labelKey: 'admin.products.title',
    showCount: true,
  },
  search: {
    enabled: true,
    placeholderKey: 'admin.products.searchPlaceholder',
    minWidth: '14rem',
  },
  filters: [],
  actions: [
    {
      id: 'add',
      labelKey: 'admin.products.actions.add',
      icon: 'assets/icons/icon-plus.svg',
      variant: 'primary',
    },
  ],
};
