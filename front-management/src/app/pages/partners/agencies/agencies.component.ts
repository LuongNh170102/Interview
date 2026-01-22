import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  TranslatePipe,
  AgencyService,
  AgencyResponse,
  AgencyListResponse,
} from '@vhandelivery/shared-ui';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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

import {
  Agency,
  generateInitials,
  generateInitialsColor,
  mapOperationalStatusToUI,
  mapApprovalStatusToUI,
} from '../../../shared/interfaces/agency.interface';
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
export class AgenciesComponent implements OnInit {
  private readonly agencyService = inject(AgencyService);
  private readonly destroyRef = inject(DestroyRef);

  // Loading state
  readonly isLoading = signal(false);

  // Statistics data from API
  readonly statisticsData = signal<{
    totalApproved: number;
    totalPending: number;
    totalActive: number;
  }>({
    totalApproved: 0,
    totalPending: 0,
    totalActive: 0,
  });

  // Statistics cards configuration - computed from API data
  readonly statisticCards = computed<StatisticCardConfig[]>(() => {
    const stats = this.statisticsData();
    const total = this.pagination().total;

    return [
      {
        value: this.formatNumber(stats.totalApproved),
        label: 'TỔNG SỐ ĐẠI LÝ',
        icon: 'assets/icons/icon-stat-store.svg',
        variant: 'primary',
        trend: {
          value: '+12.5%',
          direction: 'up',
          label: 'so với tháng trước',
        },
      },
      {
        value: this.formatNumber(stats.totalPending),
        label: 'ĐẠI LÝ CHỜ DUYỆT',
        icon: 'assets/icons/icon-stat-bell.svg',
        variant: 'error',
        subtitle: 'Yêu cầu cần xử lý ngay',
      },
      {
        value: this.formatNumber(stats.totalActive),
        label: 'ĐẠI LÝ HOẠT ĐỘNG',
        icon: 'assets/icons/icon-stat-check.svg',
        variant: 'success',
        progress:
          stats.totalApproved > 0
            ? { current: stats.totalActive, total: stats.totalApproved }
            : undefined,
      },
      {
        value: '1.24 tỷ ₫',
        label: 'DOANH THU TỪ ĐỐI TÁC',
        icon: 'assets/icons/icon-stat-coin.svg',
        variant: 'warning',
        subtitle: 'Tháng hiện tại Ước tính',
      },
    ];
  });

  // Agencies data from API
  readonly agencies = signal<Agency[]>([]);

  // Table configuration matching API response fields
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
        dateFormat: 'yyyy/MM/dd',
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
    total: 0,
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

  ngOnInit(): void {
    this.loadAgencies();
  }

  /**
   * Load agencies from API with statistics
   */
  private loadAgencies(): void {
    this.isLoading.set(true);
    const pag = this.pagination();

    this.agencyService
      .findAll({
        page: pag.page,
        limit: pag.pageSize,
        include: 'statistics',
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: AgencyListResponse) => {
          // Map API response to UI format
          const mappedAgencies = response.data.map((agency) =>
            this.mapAgencyToUI(agency)
          );
          this.agencies.set(mappedAgencies);

          // Update pagination
          this.pagination.update((prev) => ({
            ...prev,
            total: response.total,
          }));

          // Update statistics if available
          if (response.statistics) {
            this.statisticsData.set(response.statistics);
          }

          this.isLoading.set(false);
        },
        error: (error: unknown) => {
          console.error('Failed to load agencies:', error);
          this.isLoading.set(false);
        },
      });
  }

  /**
   * Map API response to UI display format
   */
  private mapAgencyToUI(agency: AgencyResponse): Agency {
    return {
      id: agency.externalId,
      code: `AGC-${agency.externalId.substring(0, 5).toUpperCase()}`,
      name: agency.name,
      initials: generateInitials(agency.name),
      initialsColor: generateInitialsColor(agency.name),
      phone: agency.phone ?? 'Chưa cập nhật',
      email: agency.email ?? 'Chưa cập nhật',
      address: agency.address ?? 'Chưa cập nhật',
      approvalStatus: mapApprovalStatusToUI(agency.approvalStatus),
      operationalStatus: mapOperationalStatusToUI(agency.operationalStatus),
      createdAt: new Date(agency.createdAt).toISOString().split('T')[0],
    };
  }

  /**
   * Format number with thousand separators
   */
  private formatNumber(value: number): string {
    return value.toLocaleString('vi-VN');
  }

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
    this.loadAgencies();
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
