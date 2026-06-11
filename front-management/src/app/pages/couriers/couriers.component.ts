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
import { FormsModule } from '@angular/forms';
import { TranslatePipe, CourierService, TranslationService } from '@vhandelivery/shared-ui';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  DataTableComponent,
  TableCellDirective,
  MobileCardDirective,
  ActionMenuDirective,
} from '../../shared/components/data-table/data-table.component';
import {
  TablePagination,
  TablePageEvent,
  TableHeaderActionEvent,
  TableHeaderSearchEvent,
  TableHeaderFilterEvent,
} from '../../shared/interfaces/table.interface';
import {
  Courier,
  CourierApiResponse,
  CourierStatistics,
} from '../../shared/interfaces/courier.interface';
import { StatisticCardComponent } from '../../shared/components/statistic-card';
import { GlobalModalService } from '../../shared/components/global-modal/global-modal.service';

function generateCourierInitials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function mapVehicleType(type: string | null): string {
  switch (type) {
    case 'bike': return 'Xe đạp';
    case 'motorbike': return 'Xe máy';
    case 'car': return 'Ô tô';
    default: return type || '';
  }
}

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
  styleUrls: ['./couriers.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CouriersComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly courierService = inject(CourierService);
  private readonly modalService = inject(GlobalModalService);
  readonly translationService = inject(TranslationService);

  readonly isLoading = signal(false);

  readonly statisticsData = signal<CourierStatistics>({
    totalApproved: 0,
    totalPending: 0,
    totalRejected: 0,
    totalActive: 0,
  });

  readonly couriers = signal<Courier[]>([]);

  readonly tableConfig = {
    id: 'couriers-table',
    columns: [
      { key: 'name', labelKey: 'Tên tài xế', type: 'custom' as const, templateRef: 'courierInfo' as any },
      { key: 'phone', labelKey: 'Số điện thoại', type: 'text' as const },
      { key: 'email', labelKey: 'Email', type: 'text' as const },
      { key: 'vehicleType', labelKey: 'Phương tiện', type: 'text' as const },
      { key: 'approvalStatus', labelKey: 'Trạng thái', type: 'status' as const, statusConfig: {
        PENDING: { labelKey: 'Chờ duyệt', variant: 'warning' as const },
        APPROVED: { labelKey: 'Đã duyệt', variant: 'success' as const },
        REJECTED: { labelKey: 'Từ chối', variant: 'error' as const },
      }},
      { key: 'createdAt', labelKey: 'Ngày đăng ký', type: 'text' as const },
    ],
    actions: [
      { id: 'menu', labelKey: 'Thao tác', icon: 'more', variant: 'default' as const },
    ],
    hoverable: true,
    rowIdKey: 'externalId',
  };

  readonly pagination = signal<TablePagination>({
    page: 1,
    pageSize: 10,
    total: 0,
    pageSizeOptions: [10, 20, 50],
  });

  readonly searchTerm = signal('');
  readonly activeMobileMenuId = signal<string | null>(null);
  readonly statusFilter = signal<string>('');

  readonly actionModalState = signal<{
    visible: boolean;
    courier: Courier | null;
    action: 'approve' | 'reject' | null;
  }>({ visible: false, courier: null, action: null });

  readonly rejectionReason = signal('');

  @HostListener('document:click')
  onDocumentClick(): void {
    if (this.activeMobileMenuId()) {
      this.activeMobileMenuId.set(null);
    }
  }

  ngOnInit(): void {
    this.loadCouriers();
  }

  getInitials(name: string): string {
    return generateCourierInitials(name);
  }

  private loadCouriers(): void {
    this.isLoading.set(true);
    const { page, pageSize } = this.pagination();

    this.courierService
      .findAll({
        page,
        limit: pageSize,
        include: 'statistics',
        approvalStatus: this.statusFilter() as any || undefined,
        search: this.searchTerm() || undefined,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.couriers.set(response.data.map((item) => this.mapApiItem(item)));
          this.pagination.update((prev) => ({ ...prev, total: response.total }));
          if (response.statistics) {
            this.statisticsData.set(response.statistics);
          }
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
  }

  private mapApiItem(item: CourierApiResponse): Courier {
    return {
      externalId: item.externalId,
      name: item.name || '',
      phone: item.phone || '',
      email: item.user?.email || '',
      vehicleType: mapVehicleType(item.vehicleType),
      vehicleNumber: item.vehicleNumber || '',
      approvalStatus: item.approvalStatus,
      operationalStatus: item.operationalStatus,
      createdAt: new Date(item.createdAt).toLocaleDateString('vi-VN'),
      approvedByUser: item.approvedByUser,
      rejectedByUser: item.rejectedByUser,
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
    if (event.filterId === 'status') {
      const next = this.statusFilter() === 'PENDING' ? '' : 'PENDING';
      this.statusFilter.set(next);
      this.loadCouriers();
    }
  }

  onHeaderAction(event: TableHeaderActionEvent): void {
    console.log('Header action:', event.actionId);
  }

  onMenuAction(action: string, courier: Courier): void {
    this.activeMobileMenuId.set(null);
    if (action === 'approve') {
      this.actionModalState.set({ visible: true, courier, action: 'approve' });
    } else if (action === 'reject') {
      this.actionModalState.set({ visible: true, courier, action: 'reject' });
    }
  }

  toggleMobileMenu(event: Event, courierId: string): void {
    event.stopPropagation();
    this.activeMobileMenuId.update((current) =>
      current === courierId ? null : courierId
    );
  }

  closeActionModal(): void {
    this.actionModalState.set({ visible: false, courier: null, action: null });
    this.rejectionReason.set('');
  }

  confirmAction(): void {
    const state = this.actionModalState();
    if (!state.courier || !state.action) return;

    if (state.action === 'approve') {
      this.courierService.approve(state.courier.externalId).subscribe({
        next: () => {
          this.modalService.showSuccess('Thành công', 'Đã duyệt tài xế thành công');
          this.closeActionModal();
          this.loadCouriers();
        },
        error: (err) => {
          this.modalService.showError('Lỗi', err?.error?.message || 'Không thể duyệt tài xế');
        },
      });
    } else if (state.action === 'reject') {
      this.courierService.reject(state.courier.externalId, this.rejectionReason()).subscribe({
        next: () => {
          this.modalService.showSuccess('Thành công', 'Đã từ chối tài xế');
          this.closeActionModal();
          this.loadCouriers();
        },
        error: (err) => {
          this.modalService.showError('Lỗi', err?.error?.message || 'Không thể từ chối tài xế');
        },
      });
    }
  }

  getActionMenuItems(courier: Courier): Array<{ id: string; label: string }> {
    if (courier.approvalStatus === 'PENDING') {
      return [
        { id: 'approve', label: 'Duyệt' },
        { id: 'reject', label: 'Từ chối' },
      ];
    }
    return [];
  }
}
