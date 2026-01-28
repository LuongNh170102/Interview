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
  AgencyService,
  AgencyResponse,
  AgencyListResponse,
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
  Agency,
  generateInitials,
  generateInitialsColor,
  mapOperationalStatusToUI,
  mapApprovalStatusToUI,
} from '../../../shared/interfaces/agency.interface';
import { StatisticCardComponent } from '../../../shared/components/statistic-card';
import {
  AGENCIES_TABLE_CONFIG,
  AGENCIES_TABLE_HEADER_CONFIG,
  AgencyStatistics,
  createStatisticCards,
} from './agencies.config';

@Component({
  selector: 'app-agencies',
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
  readonly statisticsData = signal<AgencyStatistics>({
    totalApproved: 0,
    totalPending: 0,
    totalActive: 0,
  });

  // Statistics cards configuration - computed from API data
  readonly statisticCards = computed(() =>
    createStatisticCards(this.statisticsData(), this.formatNumber)
  );

  // Agencies data from API
  readonly agencies = signal<Agency[]>([]);

  // Table configuration
  readonly tableConfig = AGENCIES_TABLE_CONFIG;

  // Table header configuration
  readonly tableHeaderConfig = AGENCIES_TABLE_HEADER_CONFIG;

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
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (this.activeMobileMenuId()) {
      this.activeMobileMenuId.set(null);
    }
  }

  // Active dropdown menu ID for mobile cards
  readonly activeMobileMenuId = signal<string | null>(null);

  // Location filter
  readonly locationFilter = signal('');

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
        approvalStatus: 'APPROVED',
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
      code: agency.externalId.toUpperCase(),
      name: agency.name,
      initials: generateInitials(agency.name),
      initialsColor: generateInitialsColor(agency.name),
      phone: agency.phone ?? 'Chưa cập nhật',
      email: agency.email ?? 'Chưa cập nhật',
      address: agency.address ?? 'Chưa cập nhật',
      storeCount: 0, // TODO: Get from API when available
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
  onMenuAction(action: string, agency: Agency): void {
    console.log(`Menu action: ${action}`, agency);
    this.activeMobileMenuId.set(null);
    // TODO: Handle menu actions - modify, activate/deactivate, delete
  }

  /**
   * Toggle mobile card action menu
   */
  toggleMobileMenu(event: Event, agencyId: string): void {
    event.stopPropagation();
    this.activeMobileMenuId.update((current) =>
      current === agencyId ? null : agencyId
    );
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

  // Mobile search handlers
  onMobileSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
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
