import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@vhandelivery/shared-ui';
import { SlideOverPanelComponent, SlideOverConfig } from '../../../shared/components/slide-over-panel/slide-over-panel.component';

interface LocalizedString {
  vi: string;
  en?: string;
  ko?: string;
}

interface Product {
  id?: number;
  externalId: string;
  name: LocalizedString | string;
  description?: LocalizedString | string;
  price: number;
  sku: string;
  stock: number;
  isActive: boolean;
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  metadata?: {
    images?: string[];
    thumbnail?: string;
  };
  category?: {
    id: number;
    externalId: string;
    name: LocalizedString | string;
  };
}

@Component({
  selector: 'app-products-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe, SlideOverPanelComponent, FormsModule],
  templateUrl: './products-list.component.html',
  styleUrls: ['./products-list.component.scss'],
})
export class ProductsListComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly fb = inject(FormBuilder);

  // States
  readonly merchant = signal<any>(null);
  readonly products = signal<Product[]>([]);
  readonly categories = signal<any[]>([]);
  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly isFormOpen = signal(false);
  readonly editingProduct = signal<Product | null>(null);

  // Pagination
  readonly page = signal(1);
  readonly pageSize = signal(10);
  readonly totalProducts = signal(0);

  readonly searchQuery = signal('');
  private searchDebounce: any = null;
  readonly isDragOver = signal(false);
  readonly isPreviewOpen = signal(false);

  // Slide-over configuration
  readonly slideOverConfig = signal<SlideOverConfig>({
    title: 'Create New Product',
    width: 'md',
    showCloseButton: true,
    showBackdrop: true,
    closeOnBackdropClick: true,
    closeOnEscape: true,
  });

  // Product Form
  readonly productForm: FormGroup = this.fb.group({
    nameVi: ['', Validators.required],
    nameEn: [''],
    descriptionVi: [''],
    descriptionEn: [''],
    price: [0, [Validators.required, Validators.min(0)]],
    sku: ['', Validators.required],
    stock: [0, [Validators.required, Validators.min(0)]],
    categoryExternalId: [''],
    imageUrl: [''],
    isActive: [true],
    status: ['PUBLISHED'],
  });

  ngOnInit(): void {
    this.loadMerchantAndData();
    this.loadCategories();
  }

  loadMerchantAndData(): void {
    this.isLoading.set(true);
    this.http.get<any>('/api/merchants/my-merchant').subscribe({
      next: (merchant) => {
        this.merchant.set(merchant);
        this.loadProducts();
      },
      error: (err) => {
        console.error('Failed to get my merchant, falling back to first merchant:', err);
        this.http.get<any>('/api/merchants/public/list').subscribe({
          next: (merchants) => {
            if (merchants && merchants.length > 0) {
              this.http.get<any>(`/api/merchants/${merchants[0].externalId}`).subscribe({
                next: (fullMerchant) => {
                  this.merchant.set(fullMerchant);
                  this.loadProducts();
                },
                error: () => {
                  this.isLoading.set(false);
                }
              });
            } else {
              this.isLoading.set(false);
            }
          },
          error: () => this.isLoading.set(false),
        });
      },
    });
  }

  loadProducts(): void {
    const m = this.merchant();
    if (!m) return;

    this.isLoading.set(true);
    const params: any = {
      page: this.page(),
      limit: this.pageSize(),
    };
    if (this.searchQuery().trim()) {
      params['search'] = this.searchQuery().trim();
    }
    
    this.http.get<any>(`/api/products/merchant/${m.externalId}`, { params }).subscribe({
      next: (res) => {
        if (res && Array.isArray(res.data)) {
          this.products.set(res.data);
          this.totalProducts.set(res.total || res.data.length);
        } else if (Array.isArray(res)) {
          this.products.set(res);
          this.totalProducts.set(res.length);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load products:', err);
        this.isLoading.set(false);
      },
    });
  }

  loadCategories(): void {
    this.http.get<any[]>('/api/categories').subscribe({
      next: (cats) => {
        this.categories.set(cats || []);
      },
      error: (err) => {
        console.error('Failed to load categories:', err);
      },
    });
  }

  getLocalizedName(nameObj: any): string {
    if (typeof nameObj === 'string') return nameObj;
    if (nameObj && typeof nameObj === 'object') {
      return nameObj.vi || nameObj.en || '';
    }
    return '';
  }

  getLocalizedDescription(descObj: any): string {
    if (typeof descObj === 'string') return descObj;
    if (descObj && typeof descObj === 'object') {
      return descObj.vi || descObj.en || '';
    }
    return '';
  }

  openAddForm(): void {
    this.editingProduct.set(null);
    this.slideOverConfig.set({
      ...this.slideOverConfig(),
      title: 'Create New Product',
    });
    this.productForm.reset({
      price: 0,
      stock: 0,
      isActive: true,
      status: 'PUBLISHED',
      categoryExternalId: '',
    });
    this.isFormOpen.set(true);
  }

  openEditForm(product: Product): void {
    this.editingProduct.set(product);
    this.slideOverConfig.set({
      ...this.slideOverConfig(),
      title: 'Modify Product Details',
    });
    
    let nameVi = '';
    let nameEn = '';
    if (typeof product.name === 'string') {
      nameVi = product.name;
    } else if (product.name) {
      nameVi = product.name.vi || '';
      nameEn = product.name.en || '';
    }

    let descVi = '';
    let descEn = '';
    if (typeof product.description === 'string') {
      descVi = product.description;
    } else if (product.description) {
      descVi = product.description.vi || '';
      descEn = product.description.en || '';
    }

    const img = product.metadata?.thumbnail || (product.metadata?.images && product.metadata.images[0]) || '';

    this.productForm.patchValue({
      nameVi,
      nameEn,
      descriptionVi: descVi,
      descriptionEn: descEn,
      price: product.price,
      sku: product.sku,
      stock: product.stock,
      categoryExternalId: product.category?.externalId || '',
      imageUrl: img,
      isActive: product.isActive,
      status: product.status || 'PUBLISHED',
    });
    this.isFormOpen.set(true);
  }

  closeForm(): void {
    this.isFormOpen.set(false);
    this.editingProduct.set(null);
  }

  saveProduct(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    const formVal = this.productForm.value;
    const m = this.merchant();
    if (!m) return;

    this.isSaving.set(true);

    const payload = {
      name: {
        vi: formVal.nameVi,
        en: formVal.nameEn || formVal.nameVi,
      },
      description: {
        vi: formVal.descriptionVi || '',
        en: formVal.descriptionEn || '',
      },
      price: Number(formVal.price),
      sku: formVal.sku,
      stock: Number(formVal.stock),
      categoryExternalId: formVal.categoryExternalId,
      metadata: {
        thumbnail: formVal.imageUrl || 'assets/images/default-food.png',
        images: formVal.imageUrl ? [formVal.imageUrl] : ['assets/images/default-food.png'],
      },
      isActive: formVal.isActive,
      status: formVal.status || 'PUBLISHED',
    };

    const editProd = this.editingProduct();
    if (editProd) {
      this.http.patch<any>(`/api/products/${editProd.externalId}`, payload).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.closeForm();
          this.loadProducts();
        },
        error: (err) => {
          console.error('Failed to update product:', err);
          this.isSaving.set(false);
        },
      });
    } else {
      this.http.post<any>(`/api/products?merchantId=${m.externalId}`, payload).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.closeForm();
          this.loadProducts();
        },
        error: (err) => {
          console.error('Failed to create product:', err);
          this.isSaving.set(false);
        },
      });
    }
  }

  deleteProduct(product: Product): void {
    if (confirm(`Are you sure you want to delete ${this.getLocalizedName(product.name)}?`)) {
      this.http.delete<any>(`/api/products/${product.externalId}`).subscribe({
        next: () => {
          this.loadProducts();
        },
        error: (err) => {
          console.error('Failed to delete product:', err);
        },
      });
    }
  }

  toggleActive(product: Product): void {
    const nextActive = !product.isActive;
    this.http.patch<any>(`/api/products/${product.externalId}`, { isActive: nextActive }).subscribe({
      next: () => {
        this.loadProducts();
      },
      error: (err) => {
        console.error('Failed to toggle product status:', err);
      },
    });
  }

  onPageChange(pageIndex: number): void {
    this.page.set(pageIndex);
    this.loadProducts();
  }

  onSearch(query: string): void {
    this.searchQuery.set(query);
    clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => {
      this.page.set(1);
      this.loadProducts();
    }, 350);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(true);
  }

  onDragLeave(): void {
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.readImageFile(files[0]);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.readImageFile(input.files[0]);
    }
  }

  private readImageFile(file: File): void {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      this.productForm.patchValue({ imageUrl: dataUrl });
    };
    reader.readAsDataURL(file);
  }

  clearImage(): void {
    this.productForm.patchValue({ imageUrl: '' });
  }

  openPreview(): void {
    this.isPreviewOpen.set(true);
  }

  formatPreviewPrice(price: any): string {
    const num = Number(price) || 0;
    return num.toLocaleString('vi-VN') + ' đ';
  }

  formatPrice(price: any): string {
    if (price === null || price === undefined) {
      return '0 đ';
    }
    let num = 0;
    if (typeof price === 'object') {
      if (typeof price.toNumber === 'function') {
        num = price.toNumber();
      } else if (typeof price.toFixed === 'function') {
        num = Number(price.toFixed());
      } else if (price.d && Array.isArray(price.d)) {
        num = Number(price.d[0] || 0);
      } else {
        num = Number(price.toString() || 0);
      }
    } else {
      num = Number(price);
    }
    if (isNaN(num)) {
      num = 0;
    }
    return num.toLocaleString('vi-VN') + ' đ';
  }
}
