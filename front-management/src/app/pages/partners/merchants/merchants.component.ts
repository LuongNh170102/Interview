import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslatePipe } from '@vhandelivery/shared-ui';
import {
  DataTableComponent,
  TableCellDirective,
} from '../../../shared/components/data-table/data-table.component';
import { PARTNERS_TAB_CONFIG } from '../../../shared/menu.config';
import {
  TableActionEvent,
  TableConfig,
  TablePageEvent,
  TablePagination,
  TableSortEvent,
} from '../../../shared/interfaces/table.interface';
import { Merchant } from '../../../shared/interfaces/merchant.interface';

/**
 * Merchant interface for DataTable
 * Using index signature for generic type compatibility
 */

@Component({
  selector: 'app-merchants',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TranslatePipe,
    DataTableComponent,
    TableCellDirective,
  ],
  templateUrl: './merchants.component.html',
  styleUrl: './merchants.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MerchantsComponent {
  readonly tabConfig = PARTNERS_TAB_CONFIG;

  // Sample data
  readonly merchants = signal<Merchant[]>([
    {
      id: '1',
      code: 'MCH-001',
      name: 'Cửa hàng Phở Hà Nội',
      avatarUrl: '',
      agency: 'Đại lý Miền Bắc',
      phone: '0912 345 678',
      productCount: 45,
      status: 'active',
      createdAt: '2025-01-15',
    },
    {
      id: '2',
      code: 'MCH-002',
      name: 'Quán Bún Bò Huế',
      avatarUrl: '',
      agency: 'Đại lý Miền Trung',
      phone: '0923 456 789',
      productCount: 32,
      status: 'pending',
      createdAt: '2025-01-14',
    },
    {
      id: '3',
      code: 'MCH-003',
      name: 'Tiệm Bánh Mì Sài Gòn',
      avatarUrl: '',
      agency: 'Đại lý Miền Nam',
      phone: '0934 567 890',
      productCount: 28,
      status: 'active',
      createdAt: '2025-01-13',
    },
    {
      id: '4',
      code: 'MCH-004',
      name: 'Cà Phê Trung Nguyên',
      avatarUrl: '',
      agency: 'Đại lý Miền Nam',
      phone: '0945 678 901',
      productCount: 56,
      status: 'inactive',
      createdAt: '2025-01-12',
    },
  ]);

  // Table configuration
  readonly tableConfig: TableConfig<Merchant> = {
    id: 'merchants-table',
    columns: [
      {
        key: 'name',
        labelKey: 'admin.partners.table.merchantName',
        type: 'custom',
        templateRef: 'merchantInfo',
        width: '280px',
      },
      {
        key: 'agency',
        labelKey: 'admin.partners.table.agency',
        type: 'text',
      },
      {
        key: 'phone',
        labelKey: 'admin.partners.table.phone',
        type: 'text',
      },
      {
        key: 'productCount',
        labelKey: 'admin.partners.table.productCount',
        type: 'number',
        align: 'center',
        sortable: true,
      },
      {
        key: 'status',
        labelKey: 'admin.partners.table.status',
        type: 'status',
        statusConfig: {
          active: { labelKey: 'common.status.active', variant: 'success' },
          inactive: { labelKey: 'common.status.inactive', variant: 'error' },
          pending: { labelKey: 'common.status.pending', variant: 'warning' },
        },
      },
      {
        key: 'createdAt',
        labelKey: 'admin.partners.table.createdAt',
        type: 'date',
        dateFormat: 'dd/MM/yyyy',
        sortable: true,
      },
    ],
    actions: [
      {
        id: 'view',
        labelKey: 'common.button.view',
        icon: 'view',
        variant: 'default',
      },
      {
        id: 'edit',
        labelKey: 'common.button.edit',
        icon: 'edit',
        variant: 'default',
      },
    ],
    hoverable: true,
    rowIdKey: 'id',
  };

  // Pagination state
  readonly pagination = signal<TablePagination>({
    page: 1,
    pageSize: 10,
    total: 156,
    pageSizeOptions: [10, 20, 50],
  });

  // Search term
  readonly searchTerm = signal('');

  // Event handlers
  onActionClick(event: TableActionEvent<Merchant>): void {
    console.log('Action clicked:', event);
    // TODO: Handle view/edit actions
  }

  onPageChange(event: TablePageEvent): void {
    this.pagination.update((prev) => ({
      ...prev,
      page: event.page,
    }));
  }

  onSortChange(event: TableSortEvent): void {
    console.log('Sort changed:', event);
    // TODO: Implement sorting logic
  }

  onSearchChange(term: string): void {
    this.searchTerm.set(term);
    // TODO: Implement search filtering
  }

  onAddMerchant(): void {
    console.log('Add new merchant clicked');
    // TODO: Open add merchant modal/dialog
  }
}
