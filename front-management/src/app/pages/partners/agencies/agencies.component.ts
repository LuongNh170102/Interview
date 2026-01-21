import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@vhandelivery/shared-ui';
import {
  DataTableComponent,
  TableCellDirective,
} from '../../../shared/components/data-table/data-table.component';
import {
  TableConfig,
  TablePagination,
  TableActionEvent,
  TablePageEvent,
  TableSortEvent,
  TableHeaderConfig,
  TableHeaderActionEvent,
  TableHeaderSearchEvent,
  TableHeaderFilterEvent,
} from '../../../shared/interfaces/table.interface';

import { Agency } from '../../../shared/interfaces/agency.interface';
import { StatisticCardComponent } from '../../../shared/components/statistic-card';
import { StatisticCardConfig } from '../../../shared/interfaces/statistic-card-config.interface';

@Component({
  selector: 'app-agencies',
  standalone: true,
  imports: [
    CommonModule,
    TranslatePipe,
    DataTableComponent,
    TableCellDirective,
    StatisticCardComponent,
  ],
  templateUrl: './agencies.component.html',
  styleUrl: './agencies.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgenciesComponent {
  // Statistics cards configuration matching Figma design
  readonly statisticCards: StatisticCardConfig[] = [
    {
      value: '8,542',
      label: 'TỔNG SỐ CỬA HÀNG',
      icon: 'assets/icons/icon-stat-store.svg',
      variant: 'primary',
      trend: { value: '+12.5%', direction: 'up', label: 'so với tháng trước' },
    },
    {
      value: '128',
      label: 'CỬA HÀNG CHỜ DUYỆT',
      icon: 'assets/icons/icon-stat-bell.svg',
      variant: 'error',
      subtitle: 'Yêu cầu cần xử lý ngay',
    },
    {
      value: '7,215',
      label: 'CỬA HÀNG HOẠT ĐỘNG',
      icon: 'assets/icons/icon-stat-check.svg',
      variant: 'success',
      progress: { current: 7215, total: 8542 },
    },
    {
      value: '1.24 tỷ ₫',
      label: 'DOANH THU TỪ ĐỐI TÁC',
      icon: 'assets/icons/icon-stat-coin.svg',
      variant: 'warning',
      subtitle: 'Tháng hiện tại Ước tính',
    },
  ];

  // Sample data matching Figma design
  readonly agencies = signal<Agency[]>([
    {
      id: '1',
      code: 'MCH-98122',
      name: 'Global Logistics VN',
      initials: 'GL',
      initialsColor: '#D9F3F4',
      location: 'Quận 1, TP. Hồ Chí Minh',
      phone: '0912 345 678',
      totalMerchants: 1248,
      joinDate: '2023-12-13',
      status: 'active',
    },
    {
      id: '2',
      code: 'MCH-98122',
      name: 'Nexus Delivery',
      initials: 'NX',
      initialsColor: '#FFE3DC',
      location: 'Cầu Giấy, Hà Nội',
      phone: '0923 456 789',
      totalMerchants: 892,
      joinDate: '2023-12-13',
      status: 'inactive',
    },
    {
      id: '3',
      code: 'MCH-98122',
      name: 'Swift Dispatch',
      initials: 'SD',
      initialsColor: '#FFF7D7',
      location: 'Sơn Trà, Đà Nẵng',
      phone: '0934 567 890',
      totalMerchants: 2051,
      joinDate: '2023-12-13',
      status: 'suspended',
    },
    {
      id: '4',
      code: 'MCH-98122',
      name: 'Viet Trans Corp',
      initials: 'VT',
      initialsColor: '#E7F7EC',
      location: 'Bình Thủy, Cần Thơ',
      phone: '0945 678 901',
      totalMerchants: 654,
      joinDate: '2023-12-13',
      status: 'locked',
    },
    {
      id: '5',
      code: 'MCH-98122',
      name: 'Viet Trans Corp',
      initials: 'VT',
      initialsColor: '#E7F7EC',
      location: 'Bình Thủy, Cần Thơ',
      phone: '0956 789 012',
      totalMerchants: 654,
      joinDate: '2023-12-13',
      status: 'locked',
    },
  ]);

  // Table configuration matching Figma columns for agencies
  readonly tableConfig: TableConfig<Agency> = {
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
        key: 'location',
        labelKey: 'admin.partners.table.location',
        type: 'text',
      },
      {
        key: 'totalMerchants',
        labelKey: 'admin.partners.table.totalMerchants',
        type: 'number',
        align: 'center',
        sortable: true,
      },
      {
        key: 'joinDate',
        labelKey: 'admin.partners.table.joinDate',
        type: 'date',
        dateFormat: 'yyyy/MM/dd',
        sortable: true,
      },
      {
        key: 'status',
        labelKey: 'admin.partners.table.status',
        type: 'status',
        statusConfig: {
          active: { labelKey: 'common.status.active', variant: 'success' },
          pending: { labelKey: 'common.status.pending', variant: 'warning' },
          suspended: { labelKey: 'common.status.suspended', variant: 'info' },
          locked: { labelKey: 'common.status.locked', variant: 'error' },
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

  // Table header configuration
  readonly tableHeaderConfig: TableHeaderConfig = {
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

  // Pagination state
  readonly pagination = signal<TablePagination>({
    page: 1,
    pageSize: 10,
    total: 148,
    pageSizeOptions: [10, 20, 50],
  });

  // Search term
  readonly searchTerm = signal('');

  // Active dropdown menu ID
  readonly activeMenuId = signal<string | null>(null);

  // Location filter
  readonly locationFilter = signal('');

  // Computed total pages for pagination
  readonly totalPages = computed(() => {
    const pag = this.pagination();
    return Math.ceil(pag.total / pag.pageSize);
  });

  // Computed page numbers for pagination display (same logic as DataTable)
  readonly pageNumbers = computed(() => {
    const total = this.totalPages();
    const current = this.pagination().page;
    const pages: (number | 'ellipsis')[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      if (current > 3) pages.push('ellipsis');

      const start = Math.max(2, current - 1);
      const end = Math.min(total - 1, current + 1);

      for (let i = start; i <= end; i++) pages.push(i);

      if (current < total - 2) pages.push('ellipsis');
      pages.push(total);
    }

    return pages;
  });

  // Event handlers
  onActionClick(event: TableActionEvent<Agency>): void {
    if (event.actionId === 'menu') {
      // Toggle dropdown menu
      const rowId = event.row.id;
      this.activeMenuId.update((current) => (current === rowId ? null : rowId));
    } else {
      console.log('Action clicked:', event);
      this.activeMenuId.set(null);
    }
  }

  onMenuAction(action: string, agency: Agency): void {
    console.log(`Menu action: ${action}`, agency);
    this.activeMenuId.set(null);
    // TODO: Handle menu actions - modify, activate/deactivate, delete
  }

  closeMenu(): void {
    this.activeMenuId.set(null);
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

  onLocationChange(location: string): void {
    this.locationFilter.set(location);
    // TODO: Implement location filtering
  }

  onAddAgency(): void {
    console.log('Add new agency clicked');
    // TODO: Open add agency modal/dialog
  }

  // Header event handlers
  onHeaderSearch(event: TableHeaderSearchEvent): void {
    this.searchTerm.set(event.query);
    // TODO: Implement search filtering
  }

  onHeaderFilter(event: TableHeaderFilterEvent): void {
    console.log('Header filter clicked:', event.filterId);
    if (event.filterId === 'location') {
      // TODO: Open location filter dropdown
    }
  }

  onHeaderAction(event: TableHeaderActionEvent): void {
    switch (event.actionId) {
      case 'add':
        this.onAddAgency();
        break;
      case 'column':
        console.log('Column selector clicked');
        // TODO: Open column selector
        break;
      default:
        console.log('Header action:', event.actionId);
    }
  }
}
