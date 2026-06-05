import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  AuthService,
  formatMoneyVN,
  MerchantService,
  OrderResponse,
  OrderService,
  SelectOption,
  TranslatePipe,
  TranslationService,
} from '@vhandelivery/shared-ui';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DataTableComponent } from '../../shared/components/data-table/data-table.component';
import {
  TablePageEvent,
  TablePagination,
} from '../../shared/interfaces/table.interface';
import { CustomSelectComponent } from '../../shared/components/custom-select/custom-select.component';
import { GlobalModalService } from '../../shared/components/global-modal/global-modal.service';
import {
  OrderRow,
  ORDERS_TABLE_CONFIG,
  ORDERS_TABLE_HEADER_CONFIG,
} from './orders.config';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslatePipe,
    DataTableComponent,
    CustomSelectComponent,
  ],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdersComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly orderService = inject(OrderService);
  private readonly merchantService = inject(MerchantService);
  private readonly authService = inject(AuthService);
  private readonly modalService = inject(GlobalModalService);
  private readonly translationService = inject(TranslationService);

  readonly isLoading = signal(true);
  readonly orders = signal<OrderRow[]>([]);
  readonly tableConfig = ORDERS_TABLE_CONFIG;
  readonly tableHeaderConfig = ORDERS_TABLE_HEADER_CONFIG;
  readonly merchantOptions = signal<SelectOption[]>([]);
  readonly selectedMerchantId = signal('');
  readonly showMerchantFilter = signal(false);

  readonly pagination = signal<TablePagination>({
    page: 1,
    pageSize: 10,
    total: 0,
    pageSizeOptions: [10, 20, 50],
  });

  ngOnInit(): void {
    const isAdmin = this.authService.hasPermission('system:manage_users');
    this.showMerchantFilter.set(isAdmin);
    if (isAdmin) {
      this.loadMerchants();
      return;
    }
    this.loadOrders();
  }

  private loadMerchants(): void {
    this.merchantService
      .findAll({ limit: 100, approvalStatus: 'APPROVED' })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          const options = [
            { value: '', label: this.translationService.translate('admin.orders.allMerchants') },
            ...response.data.map((m) => ({
              value: m.externalId,
              label: m.name ?? m.externalId,
            })),
          ];
          this.merchantOptions.set(options);
          this.loadOrders();
        },
      });
  }

  onMerchantChange(merchantId: string): void {
    this.selectedMerchantId.set(merchantId);
    this.pagination.update((p) => ({ ...p, page: 1 }));
    this.loadOrders();
  }

  private loadOrders(): void {
    this.isLoading.set(true);
    const { page, pageSize } = this.pagination();
    const merchantId = this.selectedMerchantId();

    this.orderService
      .findManageOrders({
        page,
        limit: pageSize,
        merchantId: merchantId || undefined,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.orders.set(response.data.map((order) => this.mapOrder(order)));
          this.pagination.update((prev) => ({
            ...prev,
            total: response.meta.total,
          }));
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
          this.modalService.showError(
            this.translationService.translate('common.status.error'),
            this.translationService.translate('admin.orders.loadError')
          );
        },
      });
  }

  private mapOrder(order: OrderResponse): OrderRow {
    return {
      id: order.externalId.slice(0, 8).toUpperCase(),
      merchantName: order.merchant?.name ?? '—',
      totalAmount: formatMoneyVN(order.totalAmount),
      status: order.status ?? 'pending',
      statusLabel: this.getStatusLabel(order.status),
      paymentStatus: order.paymentStatus ?? 'pending',
      itemCount: order.orderItems?.length ?? 0,
      createdAt: order.createdAt,
    };
  }

  private getStatusLabel(status?: string | null): string {
    const key = `admin.orders.status.${status ?? 'pending'}`;
    const translated = this.translationService.translate(key);
    return translated === key ? (status ?? 'pending') : translated;
  }

  onPageChange(event: TablePageEvent): void {
    this.pagination.update((p) => ({ ...p, page: event.page }));
    this.loadOrders();
  }
}
