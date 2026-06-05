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
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  MerchantService,
  MyMerchantResponse,
  ProductResponse,
  ProductService,
  UpdateProductRequest,
} from '@vhandelivery/shared-ui';
import { GlobalModalService } from '../../../shared/components/global-modal/global-modal.service';

interface ProductFormModel {
  name: string;
  description: string;
  price: number | null;
  sku: string;
  stock: number | null;
  category: string;
  isActive: boolean;
  images: File[];
}

const emptyForm = (): ProductFormModel => ({
  name: '',
  description: '',
  price: null,
  sku: '',
  stock: null,
  category: '',
  isActive: true,
  images: [],
});

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductListComponent implements OnInit {
  private readonly merchantService = inject(MerchantService);
  private readonly productService = inject(ProductService);
  private readonly modalService = inject(GlobalModalService);
  private readonly destroyRef = inject(DestroyRef);

  readonly merchants = signal<MyMerchantResponse[]>([]);
  readonly selectedMerchantId = signal('');
  readonly products = signal<ProductResponse[]>([]);
  readonly isLoadingMerchants = signal(false);
  readonly isLoadingProducts = signal(false);
  readonly isSubmitting = signal(false);
  readonly page = signal(1);
  readonly pageSize = signal(10);
  readonly total = signal(0);
  readonly form = signal<ProductFormModel>(emptyForm());
  readonly editingProduct = signal<ProductResponse | null>(null);
  readonly isFormOpen = signal(false);

  readonly selectedMerchant = computed(() =>
    this.merchants().find(
      (merchant) => merchant.externalId === this.selectedMerchantId()
    )
  );

  readonly lastPage = computed(() =>
    Math.max(1, Math.ceil(this.total() / this.pageSize()))
  );

  ngOnInit(): void {
    this.loadMyMerchants();
  }

  loadMyMerchants(): void {
    this.isLoadingMerchants.set(true);
    this.merchantService
      .findMine()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.merchants.set(response.data);
          this.isLoadingMerchants.set(false);

          if (response.data.length > 0) {
            this.selectedMerchantId.set(response.data[0].externalId);
            this.loadProducts();
          }
        },
        error: () => {
          this.isLoadingMerchants.set(false);
          this.modalService.showError(
            'Load failed',
            'Could not load your managed stores.'
          );
        },
      });
  }

  onMerchantChange(merchantId: string): void {
    this.selectedMerchantId.set(merchantId);
    this.page.set(1);
    this.loadProducts();
  }

  loadProducts(): void {
    const merchantId = this.selectedMerchantId();
    if (!merchantId) {
      this.products.set([]);
      this.total.set(0);
      return;
    }

    this.isLoadingProducts.set(true);
    this.productService
      .findByMerchant(merchantId, {
        page: this.page(),
        limit: this.pageSize(),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.products.set(response.data);
          this.total.set(response.meta.total);
          this.isLoadingProducts.set(false);
        },
        error: () => {
          this.isLoadingProducts.set(false);
          this.modalService.showError(
            'Load failed',
            'Could not load products for this store.'
          );
        },
      });
  }

  openCreateForm(): void {
    this.editingProduct.set(null);
    this.form.set(emptyForm());
    this.isFormOpen.set(true);
  }

  openEditForm(product: ProductResponse): void {
    this.editingProduct.set(product);
    this.form.set({
      name: this.localizedText(product.name),
      description: this.localizedText(product.description),
      price: this.productPrice(product),
      sku: product.sku ?? '',
      stock: product.stock ?? 0,
      category: String(product.metadata?.category ?? ''),
      isActive: product.isActive ?? true,
      images: [],
    });
    this.isFormOpen.set(true);
  }

  closeForm(): void {
    if (this.isSubmitting()) return;
    this.isFormOpen.set(false);
    this.editingProduct.set(null);
    this.form.set(emptyForm());
  }

  onImageChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    this.form.update((current) => ({
      ...current,
      images: files,
    }));
  }

  updateFormField<K extends keyof ProductFormModel>(
    field: K,
    value: ProductFormModel[K]
  ): void {
    this.form.update((current) => ({
      ...current,
      [field]: value,
    }));
  }

  updateNumberField(field: 'price' | 'stock', value: string | number | null): void {
    const parsed = value === null || value === '' ? null : Number(value);
    this.form.update((current) => ({
      ...current,
      [field]: Number.isFinite(parsed) ? parsed : null,
    }));
  }

  submitForm(): void {
    const merchantId = this.selectedMerchantId();
    const form = this.form();

    if (!merchantId || !form.name.trim() || !form.sku.trim()) {
      return;
    }

    this.isSubmitting.set(true);
    const editingProduct = this.editingProduct();

    const request$ = editingProduct
      ? this.productService.update(
          editingProduct.externalId,
          this.toUpdatePayload(form)
        )
      : this.productService.create(merchantId, this.toCreateFormData(form));

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.closeForm();
        this.modalService.showSuccess(
          editingProduct ? 'Product updated' : 'Product created',
          editingProduct
            ? 'The product information has been saved.'
            : 'The product has been added to this store.'
        );
        this.loadProducts();
      },
      error: () => {
        this.isSubmitting.set(false);
        this.modalService.showError(
          editingProduct ? 'Update failed' : 'Create failed',
          'Please check the product information and try again.'
        );
      },
    });
  }

  deleteProduct(product: ProductResponse): void {
    if (!window.confirm(`Delete ${this.localizedText(product.name)}?`)) {
      return;
    }

    this.isSubmitting.set(true);
    this.productService
      .delete(product.externalId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.modalService.showSuccess(
            'Product deleted',
            'The product has been removed from this store.'
          );
          this.loadProducts();
        },
        error: () => {
          this.isSubmitting.set(false);
          this.modalService.showError(
            'Delete failed',
            'Could not delete this product.'
          );
        },
      });
  }

  nextPage(): void {
    if (this.page() >= this.lastPage()) return;
    this.page.update((value) => value + 1);
    this.loadProducts();
  }

  previousPage(): void {
    if (this.page() <= 1) return;
    this.page.update((value) => value - 1);
    this.loadProducts();
  }

  localizedText(value?: { vi?: string; en?: string; ko?: string } | null): string {
    return value?.vi ?? value?.en ?? value?.ko ?? '';
  }

  productImages(product: ProductResponse): string[] {
    return product.metadata?.images ?? [];
  }

  formatPrice(product: ProductResponse): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: product.currency || 'VND',
      maximumFractionDigits: 0,
    }).format(this.productPrice(product));
  }

  private productPrice(product: ProductResponse): number {
    const price = product.price;
    if (typeof price === 'number') {
      return price;
    }
    if (typeof price === 'string') {
      return Number(price) || 0;
    }
    if (price && typeof price === 'object') {
      const digits =
        typeof price.d === 'string' ? price.d : price.d?.join('') ?? '0';
      const exponent = price.e ?? digits.length - 1;
      return (
        Number(digits) *
        Math.sign(price.s ?? 1) *
        10 ** (exponent - digits.length + 1)
      );
    }
    return 0;
  }

  private toCreateFormData(form: ProductFormModel): FormData {
    const payload = new FormData();
    payload.append('name', JSON.stringify({ vi: form.name.trim() }));
    payload.append(
      'description',
      JSON.stringify({ vi: form.description.trim() })
    );
    payload.append('price', String(form.price ?? 0));
    payload.append('sku', form.sku.trim());
    payload.append('stock', String(form.stock ?? 0));
    payload.append('isActive', String(form.isActive));
    payload.append(
      'metadata',
      JSON.stringify({
        category: form.category.trim(),
      })
    );

    for (const image of form.images) {
      payload.append('images', image);
    }

    return payload;
  }

  private toUpdatePayload(form: ProductFormModel): UpdateProductRequest {
    const existingMetadata = this.editingProduct()?.metadata ?? {};

    return {
      name: this.toLocalizedValue(form.name),
      description: this.toLocalizedValue(form.description),
      price: form.price ?? 0,
      sku: form.sku.trim(),
      stock: form.stock ?? 0,
      isActive: form.isActive,
      metadata: {
        ...existingMetadata,
        category: form.category.trim(),
      },
    };
  }

  private toLocalizedValue(value: string) {
    const text = value.trim();
    return {
      en: text,
      vi: text,
      ko: text,
    };
  }
}
