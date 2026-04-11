import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '@vhandelivery/shared-ui';

import {
  DataTableComponent,
  TableCellDirective,
} from '../../shared/components/data-table/data-table.component';
import { GlobalModalService } from '../../shared/components/global-modal/global-modal.service';
import { StatisticCardComponent } from '../../shared/components/statistic-card';

import { CourierListResponse, CourierService } from '@vhandelivery/shared-ui';

import {
  Courier,
  createCourierStatisticCards,
  mapCourierToUI,
} from '../../shared/interfaces/courier.interface';

import {
  TableActionEvent,
  TableHeaderActionEvent,
  TablePageEvent,
  TablePagination,
} from '../../shared/interfaces/table.interface';

@Component({
  selector: 'app-couriers',
  standalone: true,
  imports: [
    CommonModule,
    TranslatePipe,
    DataTableComponent,
    TableCellDirective,
    StatisticCardComponent,
  ],
  templateUrl: './couriers.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CouriersComponent implements OnInit {
  private readonly courierService = inject(CourierService);
  private readonly modalService = inject(GlobalModalService);
  private readonly destroyRef = inject(DestroyRef); // ← Thêm để rõ ràng

  // State
  readonly isLoading = signal(false);
  readonly couriers = signal<Courier[]>([]);
  readonly statistics = signal({
    totalPending: 0,
    totalApproved: 0,
    totalActive: 0,
  });

  readonly statisticCards = computed(() =>
    createCourierStatisticCards(this.statistics())
  );

  // Table state
  readonly pagination = signal<TablePagination>({
    page: 1,
    pageSize: 10,
    total: 0,
    pageSizeOptions: [10, 20, 50],
  });

  readonly searchTerm = signal('');

  // Reject modal state
  readonly showRejectModal = signal(false);
  readonly selectedCourierForReject = signal<Courier | null>(null);
  readonly rejectionReason = signal('');

  ngOnInit(): void {
    this.loadCouriers();
  }

  private loadCouriers(): void {
    this.isLoading.set(true);

    this.courierService
      .findAll({
        page: this.pagination().page,
        limit: this.pagination().pageSize,
        include: 'statistics',
      })
      .pipe(takeUntilDestroyed(this.destroyRef)) // ← Truyền destroyRef rõ ràng hơn
      .subscribe({
        next: (response: CourierListResponse) => {
          this.couriers.set(response.data.map(mapCourierToUI));

          this.pagination.update((p) => ({
            ...p,
            total: response.total,
          }));

          if (response.statistics) {
            this.statistics.set(response.statistics);
          }

          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Failed to load couriers', err);
          this.isLoading.set(false);
          // TODO: Có thể thêm toast error chung
        },
      });
  }

  // ==================== Table Events ====================
  onPageChange(event: TablePageEvent): void {
    this.pagination.update((p) => ({ ...p, page: event.page }));
    this.loadCouriers();
  }

  onSearchChange(query: string): void {
    this.searchTerm.set(query);
    // TODO: Gọi API search khi backend hỗ trợ
  }

  onHeaderAction(event: TableHeaderActionEvent): void {
    if (event.actionId === 'add') {
      // TODO: Mở form tạo courier (slide-over hoặc modal)
      console.log('Add new courier clicked');
    }
  }

  onActionClick(event: TableActionEvent<Courier>): void {
    const { actionId, row } = event;

    if (actionId === 'approve') {
      this.approveCourier(row);
    } else if (actionId === 'reject') {
      this.openRejectModal(row);
    }
  }

  // ==================== Approve / Reject ====================
  private approveCourier(courier: Courier): void {
    this.courierService.approve(courier.id).subscribe({
      next: () => {
        this.modalService.showSuccess(
          'Thành công',
          `Tài xế ${courier.fullName} đã được duyệt`
        );
        this.loadCouriers();
      },
      error: (err) => {
        this.modalService.showError('Lỗi', 'Không thể duyệt tài xế');
      },
    });
  }

  openRejectModal(courier: Courier): void {
    this.selectedCourierForReject.set(courier);
    this.rejectionReason.set('');
    this.showRejectModal.set(true);
  }

  closeRejectModal(): void {
    this.showRejectModal.set(false);
    this.selectedCourierForReject.set(null);
    this.rejectionReason.set('');
  }

  confirmReject(): void {
    const courier = this.selectedCourierForReject();
    const reason = this.rejectionReason().trim();

    if (!courier || !reason) {
      this.modalService.showError('Lỗi', 'Vui lòng nhập lý do từ chối');
      return;
    }

    this.courierService.reject(courier.id, reason).subscribe({
      next: () => {
        this.modalService.showSuccess(
          'Đã từ chối',
          `Tài xế ${courier.fullName} đã bị từ chối`
        );
        this.closeRejectModal();
        this.loadCouriers();
      },
      error: () => {
        this.modalService.showError('Lỗi', 'Không thể từ chối tài xế');
      },
    });
  }

  // ==================== Status Helpers ====================
  getStatusClass(status: string): string {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-700';
      case 'REJECTED':
        return 'bg-red-100 text-red-700';
      case 'PENDING':
      default:
        return 'bg-yellow-100 text-yellow-700';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'APPROVED':
        return 'common.status.approved';
      case 'REJECTED':
        return 'common.status.rejected';
      default:
        return 'common.status.pending';
    }
  }
}
