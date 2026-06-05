import { TableConfig, TableHeaderConfig } from '../../shared/interfaces/table.interface';

export interface OrderRow {
  [key: string]: unknown;
  id: string;
  merchantName: string;
  totalAmount: string;
  status: string;
  statusLabel: string;
  paymentStatus: string;
  itemCount: number;
  createdAt: string;
}

export const ORDERS_TABLE_CONFIG: TableConfig<OrderRow> = {
  id: 'orders-table',
  columns: [
    {
      key: 'id',
      labelKey: 'admin.orders.table.id',
      type: 'text',
      nowrap: true,
    },
    {
      key: 'merchantName',
      labelKey: 'admin.orders.table.merchant',
      type: 'text',
    },
    {
      key: 'totalAmount',
      labelKey: 'admin.orders.table.total',
      type: 'text',
      nowrap: true,
    },
    {
      key: 'itemCount',
      labelKey: 'admin.orders.table.items',
      type: 'text',
      nowrap: true,
    },
    {
      key: 'statusLabel',
      labelKey: 'admin.orders.table.status',
      type: 'text',
    },
    {
      key: 'createdAt',
      labelKey: 'admin.orders.table.createdAt',
      type: 'date',
    },
  ],
  hoverable: true,
  rowIdKey: 'id',
  paginationItemsLabelKey: 'admin.orders.pagination.items',
};

export const ORDERS_TABLE_HEADER_CONFIG: TableHeaderConfig = {
  show: true,
  title: {
    labelKey: 'admin.orders.title',
    showCount: true,
  },
  filters: [],
  actions: [],
};
