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
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  ProductService,
  ProductResponse,
} from '@vhandelivery/shared-ui';
import {
  DataTableComponent,
  ActionMenuDirective,
  MobileCardDirective,
  TableCellDirective,
} from '../../../shared/components/data-table/data-table.component';
import {
  TableConfig,
  TableHeaderConfig,
  TablePagination,
  TablePageEvent,
  TableSortEvent,
  TableHeaderActionEvent,
  TableHeaderSearchEvent,
  TableHeaderFilterEvent,
} from '../../../shared/interfaces/table.interface';

// Hardcoded merchant ID for demo — in real app, get from auth context
const DEMO_MERCHANT_ID = 'fdb8895b-9b33-463f-b7e3-e5fffa767ce7';

@Component({
  selector: 'app-product-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DataTableComponent,
    ActionMenuDirective,
    MobileCardDirective,
    TableCellDirective,
  ],
  templateUrl: './product-management.component.html',
  styleUrl: './product-management.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductManagementComponent implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly destroyRef = inject(DestroyRef);

  readonly isLoading = signal(false);
  readonly products = signal<any[]>([]);
  readonly activeMobileMenuId = signal<string | null>(null);

  // Add/Edit modal state
  readonly showFormModal = signal(false);
  readonly isEditing = signal(false);
  readonly selectedProduct = signal<ProductResponse | null>(null);

  // Delete modal state
  readonly showDeleteModal = signal(false);
  readonly deletingProductId = signal<string | null>(null);

  // Form fields
  readonly formName = signal('');
  readonly formDescription = signal('');
  readonly formPrice = signal<number | null>(null);
  readonly formSku = signal('');
  readonly formStock = signal<number | null>(null);

  readonly pagination = signal<TablePagination>({
    page: 1,
    pageSize: 10,
    total: 0,
    pageSizeOptions: [10, 20, 50],
  });

  readonly tableConfig: TableConfig<any> = {
    id: 'products-table',
    columns: [
      { key: 'name', labelKey: 'Tên sản phẩm', type: 'text', width: '200px' },
      { key: 'price', labelKey: 'Giá', type: 'text' },
      { key: 'sku', labelKey: 'SKU', type: 'text' },
      { key: 'stock', labelKey: 'Tồn kho', type: 'text' },
      {
        key: 'isActive',
        labelKey: 'Trạng thái',
        type: 'status',
        statusConfig: {
          true: { labelKey: 'Hoạt động', variant: 'success' },
          false: { labelKey: 'Ẩn', variant: 'default' },
        },
      },
      { key: 'createdAt', labelKey: 'Ngày tạo', type: 'date', dateFormat: 'short', sortable: true },
    ],
    actions: [{ id: 'menu', labelKey: 'Hành động', icon: 'more', variant: 'default' }],
    hoverable: true,
    rowIdKey: 'externalId',
  };

  readonly tableHeaderConfig: TableHeaderConfig = {
    show: true,
    title: { labelKey: 'Quản lý sản phẩm', showCount: true },
    search: { enabled: true, placeholderKey: 'Tìm sản phẩm...', minWidth: '20rem' },
    actions: [
      {
        id: 'add',
        labelKey: 'Thêm sản phẩm',
        icon: 'assets/icons/icon-plus.svg',
        variant: 'primary',
        showOnMobile: true,
        showOnDesktop: true,
      },
    ],
  };

  @HostListener('document:click')
  onDocumentClick(): void {
    if (this.activeMobileMenuId()) {
      this.activeMobileMenuId.set(null);
    }
  }

  ngOnInit(): void {
    this.loadProducts();
  }

  private loadProducts(): void {
    this.isLoading.set(true);
    const { page, pageSize } = this.pagination();

    this.productService
      .findAllByMerchant(DEMO_MERCHANT_ID, page, pageSize)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          
          this.products.set(response.data.map(p => ({
            ...p,
            name: typeof p.name === 'object' ? (p.name?.vi || p.name?.en || '') : p.name,
            priceNum: (p.price as any)?.d?.[0] ?? null,
            price: p.price ? `${(p.price as any)?.d?.[0] ?? p.price} ${p.currency ?? 'VND'}` : '-',
          })));
          this.pagination.update(prev => ({ ...prev, total: response.meta.total }));
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Failed to load products:', err);
          this.isLoading.set(false);
        },
      });
  }

  openAddModal(): void {
    this.isEditing.set(false);
    this.selectedProduct.set(null);
    this.resetForm();
    this.showFormModal.set(true);
  }

  openEditModal(product: ProductResponse): void {
    this.isEditing.set(true);
    this.selectedProduct.set(product);
    this.formName.set(typeof product.name === 'object' ? (product.name?.vi || '') : product.name);
    this.formDescription.set(typeof product.description === 'object' ? (product.description?.vi || '') : product.description ?? '');
    this.formPrice.set((product as any).priceNum ?? null);
    this.formSku.set(product.sku ?? '');
    this.formStock.set(product.stock);
    this.showFormModal.set(true);
  }

  closeFormModal(): void {
    this.showFormModal.set(false);
    this.resetForm();
  }

  private resetForm(): void {
    this.formName.set('');
    this.formDescription.set('');
    this.formPrice.set(null);
    this.formSku.set('');
    this.formStock.set(null);
  }

  submitForm(): void {
    if (!this.formName().trim()) return;

    if (this.isEditing() && this.selectedProduct()) {
      this.productService
        .update(this.selectedProduct()!.externalId, {
          name: this.formName(),
          description: this.formDescription(),
          price: this.formPrice() ?? undefined,
          sku: this.formSku(),
          stock: this.formStock() ?? undefined,
        })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => { this.closeFormModal(); this.loadProducts(); },
          error: (err) => console.error('Update failed:', err),
        });
    } else {
      this.productService
        .create(DEMO_MERCHANT_ID, {
          name: this.formName(),
          description: this.formDescription(),
          price: this.formPrice() ?? undefined,
          sku: this.formSku(),
          stock: this.formStock() ?? undefined,
          merchantId: DEMO_MERCHANT_ID,
        })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => { this.closeFormModal(); this.loadProducts(); },
          error: (err) => console.error('Create failed:', err),
        });
    }
  }

  openDeleteModal(product: ProductResponse): void {
    this.deletingProductId.set(product.externalId);
    this.showDeleteModal.set(true);
  }

  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
    this.deletingProductId.set(null);
  }

  confirmDelete(): void {
    const id = this.deletingProductId();
    if (!id) return;
    this.productService
      .remove(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => { this.closeDeleteModal(); this.loadProducts(); },
        error: (err) => console.error('Delete failed:', err),
      });
  }

  toggleMobileMenu(event: Event, productId: string): void {
    event.stopPropagation();
    this.activeMobileMenuId.update(current => current === productId ? null : productId);
  }

  onPageChange(event: TablePageEvent): void {
    this.pagination.update(prev => ({ ...prev, page: event.page }));
    this.loadProducts();
  }

  onSortChange(event: TableSortEvent): void { console.log('Sort:', event); }
  onHeaderSearch(event: TableHeaderSearchEvent): void { console.log('Search:', event); }
  onHeaderFilter(event: TableHeaderFilterEvent): void { console.log('Filter:', event); }

  onHeaderAction(event: TableHeaderActionEvent): void {
    if (event.actionId === 'add') this.openAddModal();
  }

  onMenuAction(action: string, product: any): void {
    if (action === 'edit') this.openEditModal(product);
    if (action === 'delete') this.openDeleteModal(product);
    this.activeMobileMenuId.set(null);
  }
}