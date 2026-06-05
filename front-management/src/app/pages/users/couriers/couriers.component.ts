import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  APPROVAL_STATUS,
  ApprovalStatusValue,
  CourierResponse,
  CourierService as SharedCourierService,
  TranslatePipe,
  TranslationService,
  UpdateCourierApprovalRequest,
} from '@vhandelivery/shared-ui';
import {
  DataTableComponent,
  MobileCardDirective,
  TableCellDirective,
} from '../../../shared/components/data-table/data-table.component';
import {
  TableHeaderActionEvent,
  TableHeaderSearchEvent,
  TablePageEvent,
  TablePagination,
  TableSortEvent,
} from '../../../shared/interfaces/table.interface';
import { StatisticCardComponent } from '../../../shared/components/statistic-card';
import { GlobalModalService } from '../../../shared/components/global-modal/global-modal.service';
import {
  Courier,
  mapCourierToRow,
} from '../../../shared/interfaces/courier.interface';
import {
  COURIERS_TABLE_CONFIG,
  COURIERS_TABLE_HEADER_CONFIG,
  CourierStatistics,
  createCourierStatisticCards,
} from './couriers.config';

type PendingQueueSnapshot = {
  couriers: Courier[];
  pagination: TablePagination;
  statisticsData: CourierStatistics;
  showRejectModal: boolean;
  selectedCourier: Courier | null;
  rejectionReason: string;
  rejectError: string | null;
};

@Component({
  selector: 'app-couriers',
  standalone: true,
  imports: [
    CommonModule,
    TranslatePipe,
    DataTableComponent,
    TableCellDirective,
    MobileCardDirective,
    StatisticCardComponent,
  ],
  templateUrl: './couriers.component.html',
  styleUrl: './couriers.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CouriersComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly courierService = inject(SharedCourierService);
  private readonly modalService = inject(GlobalModalService);
  private readonly translationService = inject(TranslationService);

  readonly isLoading = signal(false);
  readonly isSubmitting = signal(false);
  readonly couriers = signal<Courier[]>([]);
  readonly searchTerm = signal('');

  readonly showRejectModal = signal(false);
  readonly selectedCourier = signal<Courier | null>(null);
  readonly rejectionReason = signal('');
  readonly rejectError = signal<string | null>(null);

  readonly statisticsData = signal<CourierStatistics>({
    totalApproved: 0,
    totalPending: 0,
    totalOnline: 0,
  });

  readonly statisticCards = computed(() =>
    createCourierStatisticCards(this.statisticsData(), this.formatNumber)
  );

  readonly tableConfig = COURIERS_TABLE_CONFIG;
  readonly tableHeaderConfig = COURIERS_TABLE_HEADER_CONFIG;

  readonly pagination = signal<TablePagination>({
    page: 1,
    pageSize: 10,
    total: 0,
    pageSizeOptions: [10, 20, 50],
  });

  ngOnInit(): void {
    this.loadCouriers();
  }

  private loadCouriers(): void {
    this.isLoading.set(true);
    const { page, pageSize } = this.pagination();

    this.courierService
      .findAll({
        page,
        limit: pageSize,
        include: 'statistics',
        approvalStatus: APPROVAL_STATUS.PENDING,
        search: this.searchTerm() || undefined,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.couriers.set(response.data.map(this.mapCourierToUI));
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
          this.modalService.showError(
            this.translationService.translate('common.status.error'),
            this.translationService.translate(
              'admin.users.couriers.toasts.loadError'
            )
          );
          this.isLoading.set(false);
        },
      });
  }

  private readonly mapCourierToUI = (courier: CourierResponse): Courier =>
    mapCourierToRow(courier);

  private formatNumber(value: number): string {
    return value.toLocaleString('vi-VN');
  }

  onPageChange(event: TablePageEvent): void {
    this.pagination.update((prev) => ({
      ...prev,
      page: event.page,
    }));
    this.loadCouriers();
  }

  onSortChange(_: TableSortEvent): void {
    // Sorting can be wired after backend supports sort params.
  }

  onHeaderSearch(event: TableHeaderSearchEvent): void {
    this.searchTerm.set(event.query);
    this.pagination.update((prev) => ({
      ...prev,
      page: 1,
    }));
    this.loadCouriers();
  }

  onHeaderAction(_: TableHeaderActionEvent): void {
    // Column visibility is handled internally by DataTable.
  }

  approveCourier(courier: Courier): void {
    if (this.isSubmitting()) {
      return;
    }

    this.submitApprovalDecision(
      courier,
      { status: APPROVAL_STATUS.APPROVED },
      {
        successKey: 'admin.users.couriers.toasts.approveSuccess',
        errorKey: 'admin.users.couriers.toasts.approveError',
        optimisticStatus: APPROVAL_STATUS.APPROVED,
      }
    );
  }

  openRejectModal(courier: Courier): void {
    this.selectedCourier.set(courier);
    this.rejectionReason.set('');
    this.rejectError.set(null);
    this.showRejectModal.set(true);
  }

  closeRejectModal(): void {
    this.showRejectModal.set(false);
    this.selectedCourier.set(null);
    this.rejectionReason.set('');
    this.rejectError.set(null);
  }

  onRejectReasonInput(event: Event): void {
    const value = (event.target as HTMLTextAreaElement).value;
    this.rejectionReason.set(value);

    if (this.rejectError()) {
      this.rejectError.set(null);
    }
  }

  submitReject(): void {
    const courier = this.selectedCourier();
    const reason = this.rejectionReason().trim();

    if (!courier) {
      return;
    }

    if (!reason) {
      this.rejectError.set(
        this.translationService.translate(
          'admin.users.couriers.reject.reasonRequired'
        )
      );
      return;
    }

    this.submitApprovalDecision(
      courier,
      {
        status: APPROVAL_STATUS.REJECTED,
        rejectionReason: reason,
      },
      {
        successKey: 'admin.users.couriers.toasts.rejectSuccess',
        errorKey: 'admin.users.couriers.toasts.rejectError',
        optimisticStatus: APPROVAL_STATUS.REJECTED,
        closeRejectModal: true,
      }
    );
  }

  private submitApprovalDecision(
    courier: Courier,
    payload: UpdateCourierApprovalRequest,
    options: {
      successKey: string;
      errorKey: string;
      optimisticStatus: ApprovalStatusValue;
      closeRejectModal?: boolean;
    }
  ): void {
    const snapshot = this.capturePendingQueueSnapshot();

    if (options.closeRejectModal) {
      this.closeRejectModal();
    }

    const optimisticallyUpdated = this.applyOptimisticQueueUpdate(
      courier.id,
      options.optimisticStatus
    );

    this.isSubmitting.set(true);
    this.courierService
      .updateApproval(courier.id, payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.modalService.showSuccess(
            this.translationService.translate('common.status.success'),
            this.translationService.translate(options.successKey)
          );
          this.isSubmitting.set(false);
          this.reconcilePendingQueueAfterMutation(optimisticallyUpdated);
        },
        error: (error) => {
          console.error('Failed to update courier approval:', error);
          this.restorePendingQueueSnapshot(snapshot);
          this.modalService.showError(
            this.translationService.translate('common.status.error'),
            this.translationService.translate(options.errorKey)
          );
          this.isSubmitting.set(false);
        },
      });
  }

  private capturePendingQueueSnapshot(): PendingQueueSnapshot {
    return {
      couriers: this.couriers(),
      pagination: this.pagination(),
      statisticsData: this.statisticsData(),
      showRejectModal: this.showRejectModal(),
      selectedCourier: this.selectedCourier(),
      rejectionReason: this.rejectionReason(),
      rejectError: this.rejectError(),
    };
  }

  private restorePendingQueueSnapshot(snapshot: PendingQueueSnapshot): void {
    this.couriers.set(snapshot.couriers);
    this.pagination.set(snapshot.pagination);
    this.statisticsData.set(snapshot.statisticsData);
    this.showRejectModal.set(snapshot.showRejectModal);
    this.selectedCourier.set(snapshot.selectedCourier);
    this.rejectionReason.set(snapshot.rejectionReason);
    this.rejectError.set(snapshot.rejectError);
  }

  private applyOptimisticQueueUpdate(
    courierId: string,
    optimisticStatus: ApprovalStatusValue
  ): boolean {
    const hasCourier = this.couriers().some(
      (courier) => courier.id === courierId
    );

    if (!hasCourier) {
      return false;
    }

    this.couriers.update((current) =>
      current.filter((courier) => courier.id !== courierId)
    );
    this.pagination.update((current) => ({
      ...current,
      total: Math.max(current.total - 1, 0),
    }));
    this.statisticsData.update((current) => ({
      ...current,
      totalPending: Math.max(current.totalPending - 1, 0),
      totalApproved:
        optimisticStatus === APPROVAL_STATUS.APPROVED
          ? current.totalApproved + 1
          : current.totalApproved,
    }));

    return true;
  }

  private reconcilePendingQueueAfterMutation(
    optimisticallyUpdated: boolean
  ): void {
    if (!optimisticallyUpdated) {
      this.loadCouriers();
      return;
    }

    const { page, pageSize, total } = this.pagination();
    const maxPage = Math.max(1, Math.ceil(total / pageSize));

    if (page > maxPage) {
      this.pagination.update((current) => ({
        ...current,
        page: maxPage,
      }));
      this.loadCouriers();
      return;
    }

    if (this.couriers().length === 0 && total > 0) {
      this.loadCouriers();
    }
  }
}
