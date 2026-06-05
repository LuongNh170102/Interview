import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  TranslatePipe,
  ProductService,
  ProductResponse,
  ProductPublishStatus,
  MerchantService,
  MerchantApiResponse,
  CategoryService,
  TranslationService,
  AuthService,
  formatMoneyVN,
  parseMoney,
  SelectOption,
} from '@vhandelivery/shared-ui';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  DataTableComponent,
  TableCellDirective,
} from '../../../shared/components/data-table/data-table.component';
import {
  TableActionEvent,
  TableHeaderActionEvent,
  TableHeaderSearchEvent,
  TablePageEvent,
  TablePagination,
} from '../../../shared/interfaces/table.interface';
import { CustomSelectComponent } from '../../../shared/components/custom-select/custom-select.component';
import {
  PRODUCTS_TABLE_CONFIG,
  PRODUCTS_TABLE_HEADER_CONFIG,
  ProductRow,
} from './products-list.config';
import { GlobalModalService } from '../../../shared/components/global-modal/global-modal.service';

@Component({
  selector: 'app-products-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TranslatePipe,
    DataTableComponent,
    TableCellDirective,
    CustomSelectComponent,
  ],
  templateUrl: './products-list.component.html',
  styleUrl: './products-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsListComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly productService = inject(ProductService);
  private readonly merchantService = inject(MerchantService);
  private readonly authService = inject(AuthService);
  private readonly categoryService = inject(CategoryService);
  private readonly modalService = inject(GlobalModalService);
  private readonly translationService = inject(TranslationService);
  private readonly fb = inject(FormBuilder);

  readonly isLoading = signal(true);
  readonly products = signal<ProductRow[]>([]);
  readonly tableConfig = PRODUCTS_TABLE_CONFIG;
  readonly tableHeaderConfig = PRODUCTS_TABLE_HEADER_CONFIG;
  readonly searchTerm = signal('');
  readonly merchantOptions = signal<SelectOption[]>([]);
  readonly categoryOptions = signal<SelectOption[]>([]);
  readonly selectedMerchantId = signal('');
  readonly showFormModal = signal(false);
  readonly editingProductId = signal<string | null>(null);
  readonly submitting = signal(false);
  readonly selectedImages = signal<File[]>([]);
  readonly existingImages = signal<string[]>([]);
  readonly showPreviewModal = signal(false);
  readonly isDragOver = signal(false);
  readonly publishStatusOptions = signal<SelectOption[]>([]);

  readonly pagination = signal<TablePagination>({
    page: 1,
    pageSize: 10,
    total: 0,
    pageSizeOptions: [10, 20, 50],
  });

  readonly productForm = this.fb.group({
    nameVi: ['', Validators.required],
    descriptionVi: [''],
    price: [0, [Validators.required, Validators.min(0)]],
    sku: ['', Validators.required],
    stock: [0, [Validators.required, Validators.min(0)]],
    categoryId: [''],
    publishStatus: ['DRAFT' as ProductPublishStatus, Validators.required],
  });

  ngOnInit(): void {
    this.publishStatusOptions.set([
      {
        value: 'DRAFT',
        label: this.translationService.translate('admin.products.status.draft'),
      },
      {
        value: 'PUBLISHED',
        label: this.translationService.translate('admin.products.status.published'),
      },
      {
        value: 'ARCHIVED',
        label: this.translationService.translate('admin.products.status.archived'),
      },
    ]);
    this.loadMerchants();
    this.loadCategories();
  }

  private loadMerchants(): void {
    const isAdmin = this.authService.hasPermission('system:manage_users');

    if (isAdmin) {
      this.merchantService
        .findAll({ limit: 100, approvalStatus: 'APPROVED' })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (response) => this.applyMerchantOptions(response.data),
        });
      return;
    }

    this.merchantService
      .findMine()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (merchants) => this.applyMerchantOptions(merchants),
      });
  }

  private applyMerchantOptions(
    merchants: Array<Pick<MerchantApiResponse, 'externalId' | 'name'>>
  ): void {
    const options = merchants.map((m) => ({
      value: m.externalId,
      label: m.name ?? m.externalId,
    }));
    this.merchantOptions.set(options);
    if (options.length && !this.selectedMerchantId()) {
      this.selectedMerchantId.set(String(options[0].value));
      this.loadProducts();
    }
  }

  private loadCategories(): void {
    this.categoryService
      .findAll({ limit: 100 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (categories) => {
          this.categoryOptions.set(
            categories.map((c) => ({
              value: c.externalId,
              label: c.name?.vi ?? c.slug ?? c.externalId,
            }))
          );
        },
      });
  }

  onMerchantChange(merchantId: string): void {
    this.selectedMerchantId.set(merchantId);
    this.pagination.update((p) => ({ ...p, page: 1 }));
    this.loadProducts();
  }

  private loadProducts(): void {
    const merchantId = this.selectedMerchantId();
    if (!merchantId) return;

    this.isLoading.set(true);
    const { page, pageSize } = this.pagination();

    this.productService
      .findByMerchant(merchantId, {
        page,
        limit: pageSize,
        search: this.searchTerm().trim() || undefined,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.products.set(response.data.map((p) => this.mapProduct(p)));
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
            this.translationService.translate('admin.products.loadError')
          );
        },
      });
  }

  private mapProduct(item: ProductResponse): ProductRow {
    const price = parseMoney(item.price);
    return {
      id: item.externalId,
      name: item.name?.vi ?? '',
      sku: item.sku ?? '',
      price: formatMoneyVN(price),
      stock: item.stock ?? 0,
      publishStatus: item.publishStatus ?? (item.isActive ? 'PUBLISHED' : 'DRAFT'),
      statusLabel: this.getPublishStatusLabel(
        item.publishStatus ?? (item.isActive ? 'PUBLISHED' : 'DRAFT')
      ),
      createdAt:
        typeof item.createdAt === 'string'
          ? item.createdAt
          : new Date(item.createdAt).toISOString(),
    };
  }

  onPageChange(event: TablePageEvent): void {
    this.pagination.update((p) => ({ ...p, page: event.page }));
    this.loadProducts();
  }

  onHeaderSearch(event: TableHeaderSearchEvent): void {
    this.searchTerm.set(event.query);
    this.pagination.update((p) => ({ ...p, page: 1 }));
    this.loadProducts();
  }

  onHeaderAction(event: TableHeaderActionEvent): void {
    if (event.actionId === 'add') {
      this.openCreateModal();
    }
  }

  onAction(event: TableActionEvent<ProductRow>): void {
    if (event.actionId === 'edit') {
      this.openEditModal(event.row.id);
      return;
    }
    if (event.actionId === 'delete') {
      this.confirmDelete(event.row);
    }
  }

  openCreateModal(): void {
    this.editingProductId.set(null);
    this.productForm.reset({
      nameVi: '',
      descriptionVi: '',
      price: 0,
      sku: '',
      stock: 0,
      categoryId: '',
      publishStatus: 'DRAFT',
    });
    this.selectedImages.set([]);
    this.existingImages.set([]);
    this.showFormModal.set(true);
  }

  private getPublishStatusLabel(status: string): string {
    const key = `admin.products.status.${status.toLowerCase()}`;
    const translated = this.translationService.translate(key);
    return translated === key ? status : translated;
  }

  openEditModal(productId: string): void {
    this.productService
      .findOne(productId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (product) => {
          this.editingProductId.set(productId);
          this.productForm.reset({
            nameVi: product.name?.vi ?? '',
            descriptionVi: product.description?.vi ?? '',
            price: parseMoney(product.price),
            sku: product.sku ?? '',
            stock: product.stock ?? 0,
            categoryId: product.metadata?.categoryId ?? '',
            publishStatus:
              product.publishStatus ??
              (product.isActive ? 'PUBLISHED' : 'DRAFT'),
          });
          this.selectedImages.set([]);
          this.existingImages.set(product.metadata?.images ?? []);
          this.showFormModal.set(true);
        },
      });
  }

  onImagesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.mergeSelectedImages(Array.from(input.files));
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);
    const files = Array.from(event.dataTransfer?.files ?? []).filter((file) =>
      file.type.startsWith('image/')
    );
    if (files.length) {
      this.mergeSelectedImages(files);
    }
  }

  private mergeSelectedImages(files: File[]): void {
    const current = this.selectedImages();
    const merged = [...current, ...files].slice(0, 10);
    this.selectedImages.set(merged);
  }

  openPreviewModal(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }
    this.showPreviewModal.set(true);
  }

  closePreviewModal(): void {
    this.showPreviewModal.set(false);
  }

  getPreviewName(): string {
    return this.productForm.value.nameVi?.trim() ?? '';
  }

  getPreviewDescription(): string {
    return this.productForm.value.descriptionVi?.trim() ?? '';
  }

  getPreviewPrice(): string {
    return formatMoneyVN(this.productForm.value.price ?? 0);
  }

  getPreviewImages(): string[] {
    const existing = this.existingImages();
    const selected = this.selectedImages().map((file) => URL.createObjectURL(file));
    return [...existing, ...selected];
  }

  closeFormModal(): void {
    this.showFormModal.set(false);
    this.editingProductId.set(null);
  }

  submitForm(): void {
    if (this.productForm.invalid || !this.selectedMerchantId()) {
      this.productForm.markAllAsTouched();
      return;
    }

    const form = this.productForm.value;
    const nameVi = form.nameVi!.trim();
    const payload = {
      name: { vi: nameVi, en: nameVi },
      description: form.descriptionVi?.trim()
        ? { vi: form.descriptionVi.trim(), en: form.descriptionVi.trim() }
        : undefined,
      price: Number(form.price),
      sku: form.sku!.trim(),
      stock: Number(form.stock),
      categoryId: form.categoryId || undefined,
      publishStatus: form.publishStatus as ProductPublishStatus,
      isActive: form.publishStatus === 'PUBLISHED',
    };

    this.submitting.set(true);
    const merchantId = this.selectedMerchantId();
    const editingId = this.editingProductId();

    const images = this.selectedImages();
    const request$ = editingId
      ? this.productService.update(editingId, payload, images)
      : this.productService.create(merchantId, payload, images);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.submitting.set(false);
        this.closeFormModal();
        this.modalService.showSuccess(
          this.translationService.translate('common.status.success'),
          this.translationService.translate(
            editingId
              ? 'admin.products.updateSuccess'
              : 'admin.products.createSuccess'
          )
        );
        this.loadProducts();
      },
      error: () => {
        this.submitting.set(false);
        this.modalService.showError(
          this.translationService.translate('common.status.error'),
          this.translationService.translate('admin.products.saveError')
        );
      },
    });
  }

  private confirmDelete(product: ProductRow): void {
    this.modalService.showConfirmation(
      this.translationService.translate('admin.products.deleteTitle'),
      `${this.translationService.translate('admin.products.deleteMessage')} ${product.name}?`,
      () => this.deleteProduct(product.id)
    );
  }

  private deleteProduct(productId: string): void {
    this.productService
      .delete(productId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.modalService.showSuccess(
            this.translationService.translate('common.status.success'),
            this.translationService.translate('admin.products.deleteSuccess')
          );
          this.loadProducts();
        },
        error: () => {
          this.modalService.showError(
            this.translationService.translate('common.status.error'),
            this.translationService.translate('admin.products.deleteError')
          );
        },
      });
  }
}
