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
import { FormsModule } from '@angular/forms';
import {
  TranslatePipe,
  CourierService,
  CourierResponse,
  CourierListResponse,
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
  TableHeaderConfig,
} from '../../../shared/interfaces/table.interface';
import { StatisticCardComponent } from '../../../shared/components/statistic-card';
import {
  COURIERS_TABLE_CONFIG,
  COURIERS_TABLE_HEADER_CONFIG,
  CourierStatistics,
  createStatisticCards,
} from './couriers.config';
import { GlobalModalService } from '../../../shared/components/global-modal/global-modal.service';

@Component({
  selector: 'app-couriers',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslatePipe,
    DataTableComponent,
    TableCellDirective,
    MobileCardDirective,
    ActionMenuDirective,
    StatisticCardComponent,
  ],
  templateUrl: './couriers.component.html',
  styleUrl: './couriers.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CouriersComponent implements OnInit {
  private readonly courierService = inject(CourierService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly modalService = inject(GlobalModalService);

  readonly isLoading = signal(false);

  readonly statisticsData = signal<CourierStatistics>({
    totalApproved: 0,
    totalPending: 0,
    totalActive: 0,
  });

  readonly statisticCards = computed(() =>
    createStatisticCards(this.statisticsData(), this.formatNumber)
  );

  readonly couriers = signal<CourierResponse[]>([]);
  readonly tableConfig = COURIERS_TABLE_CONFIG;

  get tableHeaderConfig(): TableHeaderConfig {
    const currentStatus = this.approvalStatusFilter();
    let statusSuffix = 'All';
    if (currentStatus === 'PENDING') statusSuffix = 'Pending';
    if (currentStatus === 'APPROVED') statusSuffix = 'Approved';
    if (currentStatus === 'REJECTED') statusSuffix = 'Rejected';

    return {
      ...COURIERS_TABLE_HEADER_CONFIG,
      filters: [
        {
          id: 'approvalStatus',
          labelKey: `Status: ${statusSuffix}`,
          type: 'button',
        },
      ],
    };
  }

  readonly pagination = signal<TablePagination>({
    page: 1,
    pageSize: 10,
    total: 0,
    pageSizeOptions: [10, 20, 50],
  });

  readonly searchTerm = signal('');
  readonly approvalStatusFilter = signal('');

  // Rejection modal state
  readonly isRejectionModalOpen = signal(false);
  readonly rejectionReason = signal('');
  readonly selectedCourierForReject = signal<CourierResponse | null>(null);

  @HostListener('document:click')
  onDocumentClick(): void {
    if (this.activeMobileMenuId()) {
      this.activeMobileMenuId.set(null);
    }
  }

  readonly activeMobileMenuId = signal<string | null>(null);

  ngOnInit(): void {
    this.loadCouriers();
  }

  private loadCouriers(): void {
    this.isLoading.set(true);
    const pag = this.pagination();

    this.courierService
      .findAll({
        page: pag.page,
        limit: pag.pageSize,
        shouldIncludeStatistics: true,
        approvalStatus: this.approvalStatusFilter() || undefined,
        search: this.searchTerm() || undefined,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: CourierListResponse) => {
          this.couriers.set(response.data);
          this.pagination.update((prev) => ({
            ...prev,
            total: response.total,
          }));

          if (response.statistics) {
            this.statisticsData.set(response.statistics);
          }
          this.isLoading.set(false);
        },
        error: (error: any) => {
          console.error('Failed to load couriers:', error);
          this.isLoading.set(false);
        },
      });
  }

  private formatNumber(value: number): string {
    return value.toLocaleString('vi-VN');
  }

  onMenuAction(action: string, courier: CourierResponse): void {
    this.activeMobileMenuId.set(null);
    if (action === 'approve') {
      this.approveCourier(courier);
    } else if (action === 'reject') {
      this.openRejectionModal(courier);
    }
  }

  approveCourier(courier: CourierResponse): void {
    this.modalService.showConfirmation(
      'Approve Courier',
      `Are you sure you want to approve courier ${courier.name}?`,
      () => {
        const originalCouriers = this.couriers();
        const originalStats = this.statisticsData();

        // Optimistically update lists and counts
        this.couriers.update((list) =>
          list.map((c) =>
            c.id === courier.id
              ? { ...c, approvalStatus: 'APPROVED', status: 'available' }
              : c
          )
        );
        this.statisticsData.update((stats) => ({
          ...stats,
          totalPending: Math.max(0, stats.totalPending - 1),
          totalApproved: stats.totalApproved + 1,
          totalActive: stats.totalActive + 1,
        }));

        this.courierService
          .updateStatus(courier.id, 'APPROVED')
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.modalService.showSuccess('Approved', 'Courier approved successfully.');
              this.loadCouriers();
            },
            error: (err) => {
              // Rollback on error
              this.couriers.set(originalCouriers);
              this.statisticsData.set(originalStats);

              console.error(err);
              const message = Array.isArray(err?.error?.message)
                ? err.error.message.join(', ')
                : (err?.error?.message || 'Failed to approve courier.');
              this.modalService.showError('Error', message);
            },
          });
      }
    );
  }

  openRejectionModal(courier: CourierResponse): void {
    this.selectedCourierForReject.set(courier);
    this.rejectionReason.set('');
    this.isRejectionModalOpen.set(true);
  }

  closeRejectionModal(): void {
    this.isRejectionModalOpen.set(false);
    this.selectedCourierForReject.set(null);
    this.rejectionReason.set('');
  }

  submitRejection(): void {
    const courier = this.selectedCourierForReject();
    const reason = this.rejectionReason().trim();
    if (!courier || !reason) return;

    this.isRejectionModalOpen.set(false);
    const originalCouriers = this.couriers();
    const originalStats = this.statisticsData();

    // Optimistically update lists and counts
    this.couriers.update((list) =>
      list.map((c) =>
        c.id === courier.id
          ? {
              ...c,
              approvalStatus: 'REJECTED',
              status: 'offline',
              rejectionReason: reason,
            }
          : c
      )
    );
    this.statisticsData.update((stats) => ({
      ...stats,
      totalPending: Math.max(0, stats.totalPending - 1),
    }));

    this.courierService
      .updateStatus(courier.id, 'REJECTED', reason)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.modalService.showSuccess('Rejected', 'Courier registration rejected.');
          this.closeRejectionModal();
          this.loadCouriers();
        },
        error: (err) => {
          // Rollback on error
          this.couriers.set(originalCouriers);
          this.statisticsData.set(originalStats);

          console.error(err);
          const message = Array.isArray(err?.error?.message)
            ? err.error.message.join(', ')
            : (err?.error?.message || 'Failed to reject courier.');
          this.modalService.showError('Error', message);
        },
      });
  }

  toggleMobileMenu(event: Event, id: string): void {
    event.stopPropagation();
    this.activeMobileMenuId.update((current) =>
      current === id ? null : id
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
  }

  onHeaderSearch(event: TableHeaderSearchEvent): void {
    this.searchTerm.set(event.query);
    this.pagination.update((prev) => ({ ...prev, page: 1 }));
    this.loadCouriers();
  }

  onHeaderFilter(event: TableHeaderFilterEvent): void {
    if (event.filterId === 'approvalStatus') {
      const current = this.approvalStatusFilter();
      let next = '';
      if (current === '') next = 'PENDING';
      else if (current === 'PENDING') next = 'APPROVED';
      else if (current === 'APPROVED') next = 'REJECTED';
      else if (current === 'REJECTED') next = '';

      this.approvalStatusFilter.set(next);
      this.pagination.update((prev) => ({ ...prev, page: 1 }));
      this.loadCouriers();
    }
  }

  onHeaderAction(event: TableHeaderActionEvent): void {
    console.log('Header action clicked', event);
  }
}
