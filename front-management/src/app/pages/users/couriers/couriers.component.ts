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
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  Validators,
} from '@angular/forms';
import {
  TranslatePipe,
  CourierService,
  CourierResponse,
  APPROVAL_STATUS,
  ApprovalStatusValue,
  TranslationService,
} from '@vhandelivery/shared-ui';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  DataTableComponent,
  TableCellDirective,
} from '../../../shared/components/data-table/data-table.component';
import {
  TableActionEvent,
  TableHeaderFilterEvent,
  TableHeaderSearchEvent,
  TablePageEvent,
  TablePagination,
} from '../../../shared/interfaces/table.interface';
import {
  Courier,
  mapCourierApprovalStatus,
} from '../../../shared/interfaces/courier.interface';
import {
  generateInitials,
  generateInitialsColor,
} from '../../../shared/interfaces/agency.interface';
import { StatisticCardComponent } from '../../../shared/components/statistic-card';
import {
  COURIERS_TABLE_CONFIG,
  COURIERS_TABLE_HEADER_CONFIG,
  createCourierStatisticCards,
} from './couriers.config';
import { GlobalModalService } from '../../../shared/components/global-modal/global-modal.service';

@Component({
  selector: 'app-couriers',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TranslatePipe,
    DataTableComponent,
    TableCellDirective,
    StatisticCardComponent,
  ],
  templateUrl: './couriers.component.html',
  styleUrl: './couriers.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CouriersComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly courierService = inject(CourierService);
  private readonly modalService = inject(GlobalModalService);
  private readonly translationService = inject(TranslationService);
  private readonly fb = inject(FormBuilder);

  readonly isLoading = signal(true);
  readonly couriers = signal<Courier[]>([]);
  readonly tableConfig = COURIERS_TABLE_CONFIG;
  readonly tableHeaderConfig = COURIERS_TABLE_HEADER_CONFIG;
  readonly searchTerm = signal('');
  readonly statusFilter = signal<ApprovalStatusValue | ''>(
    APPROVAL_STATUS.PENDING
  );
  readonly registeredFrom = signal('');
  readonly registeredTo = signal('');

  readonly tableFilterValues = computed(() => ({
    status: this.statusFilter(),
  }));

  readonly showRejectModal = signal(false);
  readonly rejectTarget = signal<Courier | null>(null);
  readonly rejectSubmitting = signal(false);

  readonly rejectForm = this.fb.group({
    rejectionReason: ['', [Validators.required, Validators.minLength(5)]],
  });

  readonly statisticsData = signal({
    totalApproved: 0,
    totalPending: 0,
    totalActive: 0,
  });

  readonly statisticCards = computed(() =>
    createCourierStatisticCards(this.statisticsData(), this.formatNumber)
  );

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
    const search = this.searchTerm().trim();

    this.courierService
      .findAll({
        page,
        limit: pageSize,
        include: 'statistics',
        approvalStatus: this.statusFilter() || undefined,
        search: search || undefined,
        startDate: this.registeredFrom() || undefined,
        endDate: this.registeredTo() || undefined,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.couriers.set(response.data.map((item) => this.mapToCourier(item)));
          this.pagination.update((prev) => ({
            ...prev,
            total: response.total,
          }));
          if (response.statistics) {
            this.statisticsData.set(response.statistics);
          }
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
          this.modalService.showError(
            this.translationService.translate('common.status.error'),
            this.translationService.translate('admin.users.couriers.loadError')
          );
        },
      });
  }

  private mapToCourier(item: CourierResponse): Courier {
    const displayName = item.name ?? item.user?.username ?? 'N/A';
    return {
      id: item.externalId,
      name: displayName,
      phone: item.phone ?? '',
      email: item.email ?? item.user?.email ?? '',
      vehicleType: item.vehicleType ?? '',
      address: item.address ?? '',
      ownerEmail: item.user?.email ?? '',
      ownerName: item.user?.username ?? '',
      initials: generateInitials(displayName),
      initialsColor: generateInitialsColor(displayName),
      approvalStatus: mapCourierApprovalStatus(item.approvalStatus),
      createdAt:
        typeof item.createdAt === 'string'
          ? item.createdAt
          : item.createdAt.toISOString(),
    };
  }

  onPageChange(event: TablePageEvent): void {
    this.pagination.update((prev) => ({ ...prev, page: event.page }));
    this.loadCouriers();
  }

  onHeaderSearch(event: TableHeaderSearchEvent): void {
    this.searchTerm.set(event.query);
    this.pagination.update((prev) => ({ ...prev, page: 1 }));
    this.loadCouriers();
  }

  onHeaderFilter(event: TableHeaderFilterEvent): void {
    if (event.filterId !== 'status') return;

    const value = String(event.value ?? '');
    this.statusFilter.set(value as ApprovalStatusValue | '');
    this.pagination.update((prev) => ({ ...prev, page: 1 }));
    this.loadCouriers();
  }

  onRegisteredFromChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.registeredFrom.set(value);
    this.pagination.update((prev) => ({ ...prev, page: 1 }));
    this.loadCouriers();
  }

  onRegisteredToChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.registeredTo.set(value);
    this.pagination.update((prev) => ({ ...prev, page: 1 }));
    this.loadCouriers();
  }

  clearDateFilter(): void {
    this.registeredFrom.set('');
    this.registeredTo.set('');
    this.pagination.update((prev) => ({ ...prev, page: 1 }));
    this.loadCouriers();
  }

  onAction(event: TableActionEvent<Courier>): void {
    if (event.actionId === 'approve') {
      this.confirmApprove(event.row);
      return;
    }
    if (event.actionId === 'reject') {
      this.openRejectModal(event.row);
    }
  }

  private confirmApprove(courier: Courier): void {
    this.modalService.showConfirmation(
      this.translationService.translate('admin.users.couriers.approveTitle'),
      `${this.translationService.translate('admin.users.couriers.approveMessage')} ${courier.name}?`,
      () => this.approveCourier(courier)
    );
  }

  private approveCourier(courier: Courier): void {
    const previous = this.couriers();
    this.couriers.update((items) =>
      items.filter((item) => item.id !== courier.id)
    );

    this.courierService
      .approve(courier.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.modalService.showSuccess(
            this.translationService.translate('common.status.success'),
            this.translationService.translate(
              'admin.users.couriers.approveSuccess'
            )
          );
          this.loadCouriers();
        },
        error: () => {
          this.couriers.set(previous);
          this.modalService.showError(
            this.translationService.translate('common.status.error'),
            this.translationService.translate(
              'admin.users.couriers.approveError'
            )
          );
        },
      });
  }

  openRejectModal(courier: Courier): void {
    this.rejectTarget.set(courier);
    this.rejectForm.reset();
    this.showRejectModal.set(true);
  }

  closeRejectModal(): void {
    this.showRejectModal.set(false);
    this.rejectTarget.set(null);
    this.rejectForm.reset();
  }

  submitReject(): void {
    if (this.rejectForm.invalid || !this.rejectTarget()) {
      this.rejectForm.markAllAsTouched();
      return;
    }

    const courier = this.rejectTarget()!;
    const reason = this.rejectForm.value.rejectionReason!.trim();
    const previous = this.couriers();

    this.rejectSubmitting.set(true);
    this.couriers.update((items) =>
      items.filter((item) => item.id !== courier.id)
    );

    this.courierService
      .reject(courier.id, { rejectionReason: reason })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.rejectSubmitting.set(false);
          this.closeRejectModal();
          this.modalService.showSuccess(
            this.translationService.translate('common.status.success'),
            this.translationService.translate(
              'admin.users.couriers.rejectSuccess'
            )
          );
          this.loadCouriers();
        },
        error: () => {
          this.rejectSubmitting.set(false);
          this.couriers.set(previous);
          this.modalService.showError(
            this.translationService.translate('common.status.error'),
            this.translationService.translate('admin.users.couriers.rejectError')
          );
        },
      });
  }

  private formatNumber(value: number): string {
    return value.toLocaleString('vi-VN');
  }
}
