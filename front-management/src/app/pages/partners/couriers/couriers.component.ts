import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  HostListener,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  CourierService,
  CourierResponse,
  CourierListResponse,
} from '@vhandelivery/shared-ui';
import {
  DataTableComponent,
  TableCellDirective,
  MobileCardDirective,
  ActionMenuDirective,
} from '../../../shared/components/data-table/data-table.component';
import {
  TableConfig,
  TablePagination,
  TablePageEvent,
  TableSortEvent,
  TableHeaderActionEvent,
  TableHeaderSearchEvent,
  TableHeaderFilterEvent,
  TableHeaderConfig,
} from '../../../shared/interfaces/table.interface';
import { TranslatePipe } from '@vhandelivery/shared-ui';
import { FormsModule } from '@angular/forms';

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
    FormsModule,
  ],
  templateUrl: './couriers.component.html',
  styleUrl: './couriers.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CouriersComponent implements OnInit {
  private readonly courierService = inject(CourierService);
  private readonly destroyRef = inject(DestroyRef);

  readonly isLoading = signal(false);
  readonly couriers = signal<any[]>([]);
  readonly searchTerm = signal('');
  readonly activeMobileMenuId = signal<string | null>(null);

  // Reject modal state
  readonly showRejectModal = signal(false);
  readonly rejectReason = signal('');
  readonly selectedCourierId = signal<string | null>(null);

  readonly pagination = signal<TablePagination>({
    page: 1,
    pageSize: 10,
    total: 0,
    pageSizeOptions: [10, 20, 50],
  });

  readonly tableConfig: TableConfig<any> = {
    id: 'couriers-table',
    columns: [
      {
        key: 'name',
        labelKey: 'Tên tài xế',
        type: 'text',
        width: '200px',
      },
      {
        key: 'phone',
        labelKey: 'Số điện thoại',
        type: 'text',
      },
      {
        key: 'email',
        labelKey: 'Email',
        type: 'text',
      },
      {
        key: 'vehicleType',
        labelKey: 'Loại xe',
        type: 'text',
      },
      {
        key: 'approvalStatus',
        labelKey: 'Trạng thái',
        type: 'status',
        statusConfig: {
          PENDING: { labelKey: 'Chờ duyệt', variant: 'error' },
          APPROVED: { labelKey: 'Đã duyệt', variant: 'success' },
          REJECTED: { labelKey: 'Từ chối', variant: 'default' },
        },
      },
      {
        key: 'createdAt',
        labelKey: 'Ngày đăng ký',
        type: 'date',
        dateFormat: 'short',
        sortable: true,
      },
    ],
    actions: [
      {
        id: 'menu',
        labelKey: 'Hành động',
        icon: 'more',
        variant: 'default',
      },
    ],
    hoverable: true,
    rowIdKey: 'externalId',
  };

  readonly tableHeaderConfig: TableHeaderConfig = {
    show: true,
    title: {
      labelKey: 'Danh sách tài xế chờ duyệt',
      showCount: true,
    },
    search: {
      enabled: true,
      placeholderKey: 'Tìm theo tên, số điện thoại...',
      minWidth: '23.75rem',
    },
    actions: [],
  };

  @HostListener('document:click')
  onDocumentClick(): void {
    if (this.activeMobileMenuId()) {
      this.activeMobileMenuId.set(null);
    }
  }

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
        approvalStatus: 'PENDING',
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
          this.isLoading.set(false);
        },
        error: (error: unknown) => {
          console.error('Failed to load couriers:', error);
          this.isLoading.set(false);
        },
      });
  }

  onApprove(courier: CourierResponse): void {
    this.courierService
      .approve(courier.externalId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.loadCouriers();
        },
        error: (error: unknown) => {
          console.error('Failed to approve courier:', error);
        },
      });
  }

  openRejectModal(courier: CourierResponse): void {
    this.selectedCourierId.set(courier.externalId);
    this.rejectReason.set('');
    this.showRejectModal.set(true);
  }

  closeRejectModal(): void {
    this.showRejectModal.set(false);
    this.selectedCourierId.set(null);
    this.rejectReason.set('');
  }

  confirmReject(): void {
    const id = this.selectedCourierId();
    const reason = this.rejectReason();

    if (!id || !reason.trim()) return;

    this.courierService
      .reject(id, { rejectionReason: reason })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.closeRejectModal();
          this.loadCouriers();
        },
        error: (error: unknown) => {
          console.error('Failed to reject courier:', error);
        },
      });
  }

  toggleMobileMenu(event: Event, courierId: string): void {
    event.stopPropagation();
    this.activeMobileMenuId.update((current) =>
      current === courierId ? null : courierId
    );
  }

  onPageChange(event: TablePageEvent): void {
    this.pagination.update((prev) => ({ ...prev, page: event.page }));
    this.loadCouriers();
  }

  onSortChange(event: TableSortEvent): void {
    console.log('Sort changed:', event);
  }

  onHeaderSearch(event: TableHeaderSearchEvent): void {
    this.searchTerm.set(event.query);
    this.loadCouriers();
  }

  onHeaderFilter(event: TableHeaderFilterEvent): void {
    console.log('Filter:', event);
  }

  onHeaderAction(event: TableHeaderActionEvent): void {
    console.log('Action:', event);
  }
}