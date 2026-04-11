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
} from '../../../shared/components/data-table/data-table.component';
import { StatisticCardComponent } from '../../../shared/components/statistic-card';
import { GlobalModalService } from '../../../shared/components/global-modal/global-modal.service';

import { ProductService } from '@vhandelivery/shared-ui';

import {
  TableActionEvent,
  TableHeaderActionEvent,
  TablePageEvent,
  TablePagination,
} from '../../../shared/interfaces/table.interface';
import { Product } from '../../../shared/interfaces/product.interface';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    CommonModule,
    TranslatePipe,
    DataTableComponent,
    TableCellDirective,
    StatisticCardComponent,
  ],
  templateUrl: './product-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductListComponent implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly modalService = inject(GlobalModalService);
  private readonly destroyRef = inject(DestroyRef);

  // State
  readonly isLoading = signal(false);
  readonly products = signal<Product[]>([]);

  readonly pagination = signal<TablePagination>({
    page: 1,
    pageSize: 10,
    total: 0,
    pageSizeOptions: [10, 20, 50],
  });

  // Computed statistics
  readonly statisticCards = computed(() => [
    {
      value: this.products().length,
      labelKey: 'admin.products.stats.totalProducts',
      icon: 'assets/icons/icon-stat-store.svg',
      variant: 'primary' as const,
    },
    {
      value: this.products().filter((p) => p.isActive).length,
      labelKey: 'admin.products.stats.published',
      icon: 'assets/icons/icon-stat-check.svg',
      variant: 'success' as const,
    },
    {
      value: this.products().filter((p) => !p.isActive).length,
      labelKey: 'admin.products.stats.draft',
      icon: 'assets/icons/icon-stat-clock.svg',
      variant: 'warning' as const,
    },
  ]);

  ngOnInit(): void {
    this.loadProducts();
  }

  private loadProducts(): void {
    this.isLoading.set(true);

    this.productService
      .findAll({
        page: this.pagination().page,
        limit: this.pagination().pageSize,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          this.products.set(res.data || []);
          this.pagination.update((p) => ({
            ...p,
            total: res.meta?.total || res.total || 0,
          }));
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Error loading products:', err);
          this.modalService.showError(
            'Lỗi',
            'Không thể tải danh sách sản phẩm'
          );
          this.isLoading.set(false);
        },
      });
  }

  // Pagination handler
  onPageChange(event: TablePageEvent): void {
    this.pagination.update((p) => ({ ...p, page: event.page }));
    this.loadProducts();
  }

  // Header action (Add button)
  onHeaderAction(event: TableHeaderActionEvent): void {
    if (event.actionId === 'add') {
      // TODO: Mở form tạo sản phẩm (SlideOver hoặc Modal)
      console.log('Mở form tạo sản phẩm mới');
      // this.openCreateProductForm();
    }
  }

  // Row action (Edit, Delete, etc.)
  onActionClick(event: TableActionEvent<Product>): void {
    const { actionId, row } = event;

    switch (actionId) {
      case 'edit':
        console.log('Chỉnh sửa sản phẩm:', row);
        // this.openEditProductForm(row);
        break;

      case 'delete':
        this.confirmDeleteProduct(row);
        break;

      default:
        console.log('Action clicked:', event);
    }
  }

  // Confirm delete with modal
  private confirmDeleteProduct(product: Product): void {
    this.modalService.showConfirm(
      'Xác nhận xóa',
      `Bạn có chắc muốn xóa sản phẩm "${product.name}" không?`,
      {
        confirmText: 'Xóa',
        cancelText: 'Hủy',
        confirmVariant: 'danger',
      }
    );
    // Handle confirmation based on modal response
    if (this.modalService.lastConfirmResult) {
      this.deleteProduct(product.externalId);
    }
  }

  private deleteProduct(externalId: string): void {
    this.isLoading.set(true);

    this.productService
      .delete(externalId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.modalService.showSuccess('Thành công', 'Sản phẩm đã được xóa');
          this.loadProducts();
        },
        error: (err) => {
          console.error('Error deleting product:', err);
          this.modalService.showError('Lỗi', 'Không thể xóa sản phẩm');
          this.isLoading.set(false);
        },
      });
  }
}
