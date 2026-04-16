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
  CourierService as SharedCourierService,
  CourierQueryParams,
  CreateCourierRequest,
  APPROVAL_STATUS,
  TranslationService,
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
  Courier,
  CourierApiResponse,
  generateCourierInitials,
  generateCourierInitialsColor,
  mapCourierApprovalStatus,
  mapCourierActiveStatus
} from '../../../shared/interfaces/courier.interface';
import { StatisticCardComponent } from '../../../shared/components/statistic-card';
import {
  COURIERS_TABLE_CONFIG,
  COURIERS_TABLE_HEADER_CONFIG,
  CourierStatistics,
  createCourierStatisticCards,
} from './couriers.config';
import {
  SlideOverPanelComponent,
  SlideOverConfig,
} from '../../../shared/components/slide-over-panel/slide-over-panel.component';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { GlobalModalService } from '../../../shared/components/global-modal/global-modal.service';

@Component({
  selector: 'app-couriers',
  standalone: true,
  imports: [
    CommonModule,
    TranslatePipe,
    DataTableComponent,
    TableCellDirective,
    MobileCardDirective,
    ActionMenuDirective,
    StatisticCardComponent,
    SlideOverPanelComponent,
  ],
  templateUrl: './couriers.component.html',
  styleUrls: ['./couriers.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CouriersComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly courierService = inject(SharedCourierService);
  private readonly toastService = inject(ToastService)
  private readonly translationService = inject(TranslationService)
  private readonly modalService = inject(GlobalModalService)
  // Loading state
  readonly isLoading = signal(false);

  // Slide-over panel state
  readonly isAddCourierPanelOpen = signal(false);
  readonly addCourierPanelConfig: SlideOverConfig = {
    titleKey: 'admin.users.couriers.addCourier',
    width: 'xl',
    showCloseButton: true,
    showBackdrop: true,
    closeOnBackdropClick: true,
    closeOnEscape: true,
    showHeader: true,
    headerIcon: 'assets/icons/icon-stat-store.svg', // Store/shop icon SVG path
  };

  // Statistics data from API
  readonly statisticsData = signal<CourierStatistics>({
    totalApproved: 0,
    totalPending: 0,
    totalActive: 0,
  });

  // Statistics cards configuration - computed from API data
  readonly statisticCards = computed(() =>
    createCourierStatisticCards(this.statisticsData(), this.formatNumber)
  );

  // Couriers data from API
  readonly couriers = signal<Courier[]>([]);

  // Table configuration
  readonly tableConfig = COURIERS_TABLE_CONFIG;

  // Table header configuration
  readonly tableHeaderConfig = COURIERS_TABLE_HEADER_CONFIG;

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
  readonly customFilters = signal({
    approvalStatus: '',
    activeStatus: '',
    startDate: '',
    endDate: '',
  });

  ngOnInit(): void {
    this.loadCouriers();
  }

  /**
   * Build query params for custom courier filters.
   */
  private buildFilterQueryParams(): Partial<CourierQueryParams> {
    const { approvalStatus, activeStatus, startDate, endDate } = this.customFilters();
    const query: Partial<CourierQueryParams> = {};
    const search = this.searchTerm().trim();

    if (approvalStatus) {
      query.approvalStatus = approvalStatus as CourierQueryParams['approvalStatus'];
    }

    if (activeStatus) {
      query.activeStatus = activeStatus as CourierQueryParams['activeStatus'];
    }

    if (startDate && endDate) {
      query.startDate = startDate;
      query.endDate = endDate;
    }

    if (search) {
      query.search = search;
    }

    return query;
  }

  /**
   * Load couriers from API with statistics and custom filters.
   */
  private loadCouriers(): void {
    this.isLoading.set(true);
    const { page, pageSize } = this.pagination();

    this.courierService
      .findAll({
        page,
        limit: pageSize,
        include: 'statistics',
        ...this.buildFilterQueryParams(),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          const couriers = response.data.map((item) =>
            this.mapApiResponseToCourier(item)
          );
          this.couriers.set(couriers);

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
          console.error('Failed to load couriers:', error);
          this.isLoading.set(false);
        },
      });
  }

  /**
   * Map API response to Courier interface for display.
   */
  private mapApiResponseToCourier(item: CourierApiResponse): Courier {
    return {
      id: item.externalId,
      code: item.externalId.toUpperCase(),
      name: item.name,
      initials: generateCourierInitials(item.name),
      initialsColor: generateCourierInitialsColor(item.name),
      phone: item.phone ?? '',
      email: item.email ?? '',
      rejectionReason: item.rejectionReason ?? '',
      rejectedAt: item.rejectedAt ? String(item.rejectedAt) : '',
      approvedAt: item.approvedAt ? String(item.approvedAt) : '',
      deletedAt: item.deletedAt ? String(item.deletedAt) : '',
      vehiclePlate: item.vehiclePlate ?? '',
      vehicleType: item.vehicleType ?? '',
      currentLocation: item.currentLocation ? String(item.currentLocation) : '',
      approvalStatus: mapCourierApprovalStatus(item.approvalStatus),
      activeStatus: mapCourierActiveStatus(item.activeStatus),
      createdAt: String(item.createdAt),
    };
  }

  /**
   * Format number with thousand separators
   */
  private formatNumber(value: number): string {
    return value.toLocaleString('vi-VN');
  }

  // Event handlers
  onMenuAction(action: string, courier: Courier): void {
    console.log(`Menu action: ${action}`, courier);
    this.activeMobileMenuId.set(null);
    switch (action) {
      case 'delete':
        this.courierService.delete(courier.code).pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              // Show success toast
              this.toastService.show(this.translationService.translate('admin.users.couriers.deleteSuccess'), 'success', 'bottom-right')
              this.loadCouriers();
            },
            error: (error) => {
              // Show error toast with error details
              const errorMessage = error?.error?.message
              this.toastService.show(errorMessage ?? this.translationService.translate('admin.users.couriers.deleteError'), 'error', 'bottom-right')
            },
          });
        break
      case 'approve':
        this.courierService.updateStatus(courier.code, {
          status: APPROVAL_STATUS.APPROVED
        }).pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              // Show success toast
              this.toastService.show(this.translationService.translate('admin.users.couriers.approveSuccess'), 'success', 'bottom-right')
              this.loadCouriers();
            },
            error: (error) => {
              // Show error toast with error details
              const errorMessage = error?.error?.message
              this.toastService.show(errorMessage ?? this.translationService.translate('admin.users.couriers.approveError'), 'error', 'bottom-right')
            },
          });
        break
      case 'reject':
        this.modalService.showInput(
          'admin.users.reject.title',
          'admin.users.reject.message',
          (rejectionReason) => {
            this.courierService.updateStatus(courier.code, {
              status: APPROVAL_STATUS.REJECTED, rejectionReason
            }).pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe({
                next: () => {
                  // Show success toast
                  this.toastService.show(this.translationService.translate('admin.users.couriers.rejectSuccess'), 'success', 'bottom-right')
                  this.loadCouriers();
                },
                error: (error) => {
                  // Show error toast with error details
                  this.toastService.show(this.translationService.translate('admin.users.couriers.rejectError'), 'error', 'bottom-right')
                },
              });
          }
        );
        break
      case 'edit':
        break
      case 'view':
        break
      default:
        break
    }
  }

  /**
   * Toggle mobile card action menu
   */
  toggleMobileMenu(event: Event, courierId: string): void {
    event.stopPropagation();
    this.activeMobileMenuId.update((current) =>
      current === courierId ? null : courierId
    );
  }

  onPageChange(event: TablePageEvent): void {
    this.pagination.update((prev) => ({
      ...prev,
      page: event.page,
    }));
    this.loadCouriers();
  }

  onSortChange(event: TableSortEvent): void {
    console.log('Sort changed:', event);
    // TODO: Implement sorting logic
  }

  onSearchChange(term: string): void {
    this.searchTerm.set(term);
    console.log(term)
    // TODO: Implement search filtering
  }

  onAddCourier(): void {
    this.isAddCourierPanelOpen.set(true);
  }

  /** Close add courier panel */
  closeAddCourierPanel(): void {
    this.isAddCourierPanelOpen.set(false);
  }

  /** Reference to the add courier form component */

  /** Handle add courier form submission */
  onAddCourierSubmit(formData: CreateCourierRequest): void {
    console.log('TODO: implement add courier', formData);
  }

  // Header event handlers
  onHeaderSearch(event: TableHeaderSearchEvent): void {
    this.searchTerm.set(event.query);
    this.pagination.update((prev) => ({ ...prev, page: 1 }));
    this.loadCouriers();
  }

  onHeaderFilter(event: TableHeaderFilterEvent): void {
    const value = typeof event.value === 'string' ? event.value : '';
    this.customFilters.update((prev) => ({
      ...prev,
      [event.filterId]: value,
    }));
    this.pagination.update((prev) => ({ ...prev, page: 1 }));
    this.loadCouriers();
  }

  onHeaderAction(event: TableHeaderActionEvent): void {
    switch (event.actionId) {
      case 'add':
        this.onAddCourier();
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
