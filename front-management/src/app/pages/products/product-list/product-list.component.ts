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
  AuthService,
  CategoryService,
  type CreateProductRequest,
  MerchantApiResponse,
  MerchantService as SharedMerchantService,
  ProductResponse,
  ProductService as SharedProductService,
  type ProductStatistics,
  TranslatePipe,
  TranslationService,
  type SelectOption,
} from '@vhandelivery/shared-ui';
import {
  ActionMenuDirective,
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
import {
  SlideOverConfig,
  SlideOverPanelComponent,
} from '../../../shared/components/slide-over-panel/slide-over-panel.component';
import { GlobalModalService } from '../../../shared/components/global-modal/global-modal.service';
import { ProductFormComponent } from './components/product-form/product-form.component';
import {
  ProductRow,
  mapProductToRow,
} from '../../../shared/interfaces/product.interface';
import {
  PRODUCT_LIST_HEADER_CONFIG,
  PRODUCT_LIST_TABLE_CONFIG,
  ProductStatisticsView,
  createProductStatisticCards,
} from './product-list.config';

@Component({
  selector: 'app-product-list',
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
    ProductFormComponent,
  ],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductListComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly productService = inject(SharedProductService);
  private readonly merchantService = inject(SharedMerchantService);
  private readonly categoryService = inject(CategoryService);
  private readonly authService = inject(AuthService);
  private readonly modalService = inject(GlobalModalService);
  private readonly translationService = inject(TranslationService);

  readonly isLoading = signal(false);
  readonly isSubmitting = signal(false);
  readonly products = signal<ProductRow[]>([]);
  readonly searchTerm = signal('');

  readonly merchantOptions = signal<SelectOption[]>([]);
  readonly categoryOptions = signal<SelectOption[]>([]);
  readonly currentMerchant = signal<MerchantApiResponse | null>(null);
  readonly isMerchantOwnerView = computed(() => {
    const roles = this.authService.currentUser()?.roles ?? [];
    return (
      roles.includes('MERCHANT_OWNER') && !roles.includes('PLATFORM_ADMIN')
    );
  });

  readonly isPanelOpen = signal(false);
  readonly editingProduct = signal<ProductResponse | null>(null);

  readonly panelConfig = computed<SlideOverConfig>(() => ({
    titleKey: this.editingProduct()
      ? 'admin.productsPage.form.editTitle'
      : 'admin.productsPage.form.createTitle',
    width: 'xl',
    showCloseButton: true,
    showBackdrop: true,
    closeOnBackdropClick: true,
    closeOnEscape: true,
    showHeader: true,
    headerIcon: 'assets/icons/icon-stat-store.svg',
  }));

  readonly statisticsData = signal<ProductStatisticsView>({
    totalPublished: 0,
    totalDraft: 0,
    totalOutOfStock: 0,
  });

  readonly statisticCards = computed(() =>
    createProductStatisticCards(this.statisticsData(), this.formatNumber)
  );

  readonly tableConfig = PRODUCT_LIST_TABLE_CONFIG;
  readonly tableHeaderConfig = PRODUCT_LIST_HEADER_CONFIG;

  readonly pagination = signal<TablePagination>({
    page: 1,
    pageSize: 10,
    total: 0,
    pageSizeOptions: [10, 20, 50],
  });

  ngOnInit(): void {
    this.loadCategoryOptions();

    if (this.isMerchantOwnerView()) {
      this.loadCurrentMerchant();
      return;
    }

    this.loadMerchantOptions();
    this.loadProducts();
  }

  onPageChange(event: TablePageEvent): void {
    this.pagination.update((prev) => ({
      ...prev,
      page: event.page,
    }));
    this.loadProducts();
  }

  onSortChange(_: TableSortEvent): void {
    // Sorting can be added once backend exposes sort params.
  }

  onHeaderSearch(event: TableHeaderSearchEvent): void {
    this.searchTerm.set(event.query);
    this.pagination.update((prev) => ({ ...prev, page: 1 }));
    this.loadProducts();
  }

  onHeaderAction(event: TableHeaderActionEvent): void {
    if (event.actionId === 'add') {
      this.openCreatePanel();
    }
  }

  onMenuAction(action: 'edit' | 'delete', row: ProductRow): void {
    if (action === 'edit') {
      this.editingProduct.set(row.source);
      this.isPanelOpen.set(true);
      return;
    }

    this.modalService.showConfirmation(
      this.translationService.translate('admin.productsPage.delete.title'),
      this.translationService.translate(
        'admin.productsPage.delete.description'
      ),
      () => this.deleteProduct(row)
    );
  }

  onFormSubmit(payload: CreateProductRequest): void {
    this.isSubmitting.set(true);
    const currentProduct = this.editingProduct();
    const ownerMerchant = this.currentMerchant();
    const requestPayload =
      this.isMerchantOwnerView() && ownerMerchant
        ? { ...payload, merchantId: ownerMerchant.externalId }
        : payload;

    const request$ = currentProduct
      ? this.productService.update(currentProduct.externalId, requestPayload)
      : this.productService.create(requestPayload);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.modalService.showSuccess(
          this.translationService.translate('common.status.success'),
          this.translationService.translate(
            currentProduct
              ? 'admin.productsPage.toasts.updateSuccess'
              : 'admin.productsPage.toasts.createSuccess'
          )
        );
        this.isSubmitting.set(false);
        this.closePanel();
        this.loadProducts();
      },
      error: (error) => {
        console.error('Failed to save product:', error);
        this.modalService.showError(
          this.translationService.translate('common.status.error'),
          this.translationService.translate(
            currentProduct
              ? 'admin.productsPage.toasts.updateError'
              : 'admin.productsPage.toasts.createError'
          )
        );
        this.isSubmitting.set(false);
      },
    });
  }

  closePanel(): void {
    this.isPanelOpen.set(false);
    this.editingProduct.set(null);
  }

  openCreatePanel(): void {
    this.editingProduct.set(null);
    this.isPanelOpen.set(true);
  }

  private loadMerchantOptions(): void {
    this.merchantService
      .findAll({ approvalStatus: APPROVAL_STATUS.APPROVED, limit: 1000 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.merchantOptions.set(
            response.data.map((merchant) => ({
              value: merchant.externalId,
              label: merchant.name,
            }))
          );
        },
        error: (error) => {
          console.error('Failed to load merchants:', error);
        },
      });
  }

  private loadCategoryOptions(): void {
    this.categoryService
      .findAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (categories) => {
          this.categoryOptions.set(
            categories.map((category) => ({
              value: category.externalId,
              label: category.name,
            }))
          );
        },
        error: (error) => {
          console.error('Failed to load categories:', error);
        },
      });
  }

  private loadCurrentMerchant(): void {
    this.merchantService
      .findMine()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (merchant) => {
          this.currentMerchant.set(merchant);
          this.merchantOptions.set([
            {
              value: merchant.externalId,
              label: merchant.name,
            },
          ]);
          this.loadProducts();
        },
        error: (error) => {
          console.error('Failed to load current merchant:', error);
          this.modalService.showError(
            this.translationService.translate('common.status.error'),
            'Unable to load your merchant profile.'
          );
        },
      });
  }

  private loadProducts(): void {
    this.isLoading.set(true);
    const { page, pageSize } = this.pagination();

    const ownerMerchant = this.currentMerchant();

    if (this.isMerchantOwnerView() && !ownerMerchant) {
      this.isLoading.set(false);
      return;
    }

    this.productService
      .findAdminList({
        page,
        limit: pageSize,
        include: 'statistics',
        search: this.searchTerm() || undefined,
        merchantId: ownerMerchant?.externalId,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.products.set(
            response.data.map((product) =>
              mapProductToRow(product, this.translationService)
            )
          );
          this.pagination.update((prev) => ({
            ...prev,
            total: response.total,
          }));

          if (response.statistics) {
            this.statisticsData.set(
              response.statistics as ProductStatistics & ProductStatisticsView
            );
          }

          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Failed to load products:', error);
          this.modalService.showError(
            this.translationService.translate('common.status.error'),
            this.translationService.translate(
              'admin.productsPage.toasts.loadError'
            )
          );
          this.isLoading.set(false);
        },
      });
  }

  private deleteProduct(row: ProductRow): void {
    this.productService
      .remove(row.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.modalService.showSuccess(
            this.translationService.translate('common.status.success'),
            this.translationService.translate(
              'admin.productsPage.toasts.deleteSuccess'
            )
          );
          this.loadProducts();
        },
        error: (error) => {
          console.error('Failed to delete product:', error);
          this.modalService.showError(
            this.translationService.translate('common.status.error'),
            this.translationService.translate(
              'admin.productsPage.toasts.deleteError'
            )
          );
        },
      });
  }

  private formatNumber(value: number): string {
    return value.toLocaleString('vi-VN');
  }
}
