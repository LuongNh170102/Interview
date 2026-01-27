import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  HostListener,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  TranslatePipe,
  MerchantService as SharedMerchantService,
} from '@vhandelivery/shared-ui';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  DataTableComponent,
  TableCellDirective,
  MobileCardDirective,
  ActionMenuDirective,
} from '../../../shared/components/data-table/data-table.component';
import {
  TablePagination,
  TablePageEvent,
  TableSortEvent,
  TableHeaderActionEvent,
  TableHeaderSearchEvent,
  TableHeaderFilterEvent,
} from '../../../shared/interfaces/table.interface';
import {
  Merchant,
  MerchantApiResponse,
  generateMerchantInitials,
  generateMerchantInitialsColor,
  mapMerchantOperationalStatus,
  mapMerchantApprovalStatus,
  mapBusinessCategory,
  mapBusinessType,
  mapTagName,
} from '../../../shared/interfaces/merchant.interface';
import { StatisticCardComponent } from '../../../shared/components/statistic-card';
import {
  MERCHANTS_TABLE_CONFIG,
  MERCHANTS_TABLE_HEADER_CONFIG,
  MerchantStatistics,
  createMerchantStatisticCards,
} from './merchants.config';

@Component({
  selector: 'app-merchants',
  standalone: true,
  imports: [
    CommonModule,
    TranslatePipe,
    DataTableComponent,
    TableCellDirective,
    MobileCardDirective,
    ActionMenuDirective,
    StatisticCardComponent,
  ],
  templateUrl: './merchants.component.html',
  styleUrls: ['./merchants.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MerchantsComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly merchantService = inject(SharedMerchantService);

  // Loading state
  readonly isLoading = signal(false);

  // Statistics data from API
  readonly statisticsData = signal<MerchantStatistics>({
    totalApproved: 0,
    totalPending: 0,
    totalActive: 0,
  });

  // Statistics cards configuration - computed from API data
  readonly statisticCards = computed(() =>
    createMerchantStatisticCards(this.statisticsData(), this.formatNumber)
  );

  // Merchants data from API
  readonly merchants = signal<Merchant[]>([]);

  // Table configuration
  readonly tableConfig = MERCHANTS_TABLE_CONFIG;

  // Table header configuration
  readonly tableHeaderConfig = MERCHANTS_TABLE_HEADER_CONFIG;

  // Pagination state
  readonly pagination = signal<TablePagination>({
    page: 1,
    pageSize: 10,
    total: 0,
    pageSizeOptions: [10, 20, 50],
  });

  // Search term
  readonly searchTerm = signal('');

  // Close mobile action menu when clicking outside
  @HostListener('document:click')
  onDocumentClick(): void {
    if (this.activeMobileMenuId()) {
      this.activeMobileMenuId.set(null);
    }
  }

  // Active dropdown menu ID for mobile cards
  readonly activeMobileMenuId = signal<string | null>(null);

  // Filters
  readonly locationFilter = signal('');
  readonly statusFilter = signal('');
  readonly agencyFilter = signal('');

  ngOnInit(): void {
    this.loadMerchants();
  }

  /**
   * Load merchants from API with statistics
   */
  private loadMerchants(): void {
    this.isLoading.set(true);

    const { page, pageSize } = this.pagination();

    this.merchantService
      .findAll({
        page,
        limit: pageSize,
        include: 'statistics',
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          const merchants = response.data.map((item) =>
            this.mapApiResponseToMerchant(item)
          );
          this.merchants.set(merchants);

          this.pagination.update((prev) => ({
            ...prev,
            total: response.total,
          }));

          if (response.statistics) {
            this.statisticsData.set(response.statistics);
          }

          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Failed to load merchants:', error);
          this.isLoading.set(false);
        },
      });
  }

  /**
   * Map API response to Merchant interface for display
   */
  private mapApiResponseToMerchant(item: MerchantApiResponse): Merchant {
    return {
      id: item.externalId,
      code: `${item.externalId.substring(0, 6).toUpperCase()}`,
      name: item.name,
      initials: generateMerchantInitials(item.name),
      initialsColor: generateMerchantInitialsColor(item.name),
      phone: item.phone ?? '',
      address: item.address ?? '',
      city: item.city ?? '',
      contactName: item.contactName ?? '',

      // Related entities (grouped)
      agency: item.agency ?? null,
      brand: item.brand ?? null,
      owner: item.owner ?? null,

      // Flattened for table display
      agencyName: item.agency?.name ?? '',
      brandName: item.brand?.name ?? '',
      brandSlug: item.brand?.slug ?? '',
      ownerName: item.owner?.name ?? '',
      ownerEmail: item.owner?.email ?? '',

      businessType: mapBusinessType(item.businessType),
      businessCategory: mapBusinessCategory(item.businessCategory),
      approvalStatus: mapMerchantApprovalStatus(item.approvalStatus),
      operationalStatus: mapMerchantOperationalStatus(item.operationalStatus),
      averageRating: item.averageRating,
      totalReviews: item.totalReviews,

      // Tags
      tags: (item.tags ?? []).map((tag) => ({
        code: tag.code,
        name: mapTagName(tag.name),
        icon: tag.icon,
        color: tag.color,
      })),

      // Counts
      productCount: item.productCount ?? 0,
      orderCount: item.orderCount ?? 0,

      createdAt: item.createdAt,
    };
  }

  /**
   * Format number with thousand separators
   */
  private formatNumber(value: number): string {
    return value.toLocaleString('vi-VN');
  }

  // Event handlers
  onMenuAction(action: string, merchant: Merchant): void {
    console.log(`Menu action: ${action}`, merchant);
    this.activeMobileMenuId.set(null);
    // TODO: Handle menu actions - modify, activate/deactivate, delete
  }

  /**
   * Toggle mobile card action menu
   */
  toggleMobileMenu(event: Event, merchantId: string): void {
    event.stopPropagation();
    this.activeMobileMenuId.update((current) =>
      current === merchantId ? null : merchantId
    );
  }

  onPageChange(event: TablePageEvent): void {
    this.pagination.update((prev) => ({
      ...prev,
      page: event.page,
    }));
    this.loadMerchants();
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

  // Header event handlers
  onHeaderSearch(event: TableHeaderSearchEvent): void {
    this.searchTerm.set(event.query);
    // TODO: Implement search filtering
  }

  onHeaderFilter(event: TableHeaderFilterEvent): void {
    console.log('Header filter clicked:', event.filterId);
    switch (event.filterId) {
      case 'location':
        // TODO: Open location filter dropdown
        break;
      case 'status':
        // TODO: Open status filter dropdown
        break;
      case 'agency':
        // TODO: Open agency filter dropdown
        break;
    }
  }

  onHeaderAction(event: TableHeaderActionEvent): void {
    switch (event.actionId) {
      case 'add':
        this.onAddMerchant();
        break;
      case 'column':
        console.log('Column selector clicked');
        // Column visibility is handled by DataTable internally
        break;
      default:
        console.log('Header action:', event.actionId);
    }
  }
}
