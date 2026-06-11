import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="form-page">
      <div class="header">
        <a routerLink="/merchant/products" class="back-link">&larr; Quay lại</a>
        <h1>{{ isEditing ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới' }}</h1>
      </div>

      <div class="form-card">
        @if (errors().length > 0) {
          <div class="validation-errors">
            @for (err of errors(); track $index) {
              <div class="error-item">⚠️ {{ err }}</div>
            }
          </div>
        }

        @if (!isEditing && merchants().length > 1) {
          <div class="form-group">
            <label>Cửa hàng</label>
            <select [(ngModel)]="selectedMerchantId">
              <option value="">-- Chọn cửa hàng --</option>
              @for (m of merchants(); track m.externalId) {
                <option [value]="m.externalId">{{ m.name }}</option>
              }
            </select>
          </div>
        }
        <div class="form-group">
          <label>Tên sản phẩm (Tiếng Việt)</label>
          <input [(ngModel)]="nameVi" placeholder="Nhập tên sản phẩm" />
        </div>
        <div class="form-group">
          <label>Tên sản phẩm (English)</label>
          <input [(ngModel)]="nameEn" placeholder="Product name" />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Giá (VNĐ)</label>
            <input type="number" [(ngModel)]="price" placeholder="0" />
          </div>
          <div class="form-group">
            <label>Tồn kho</label>
            <input type="number" [(ngModel)]="stock" placeholder="0" />
          </div>
        </div>
        <div class="form-group">
          <label>Danh mục</label>
          <select [(ngModel)]="selectedCategoryId">
            <option value="">-- Chọn danh mục --</option>
            @for (cat of categories(); track cat.externalId) {
              <option [value]="cat.externalId">{{ getCategoryName(cat) }}</option>
            }
          </select>
        </div>
        <div class="form-group">
          <label>SKU</label>
          <input [(ngModel)]="sku" placeholder="Mã sản phẩm" />
        </div>
        <div class="form-group">
          <label>Mô tả</label>
          <textarea [(ngModel)]="description" rows="4" placeholder="Mô tả sản phẩm..."></textarea>
        </div>
        <div class="form-group">
          <label>Hình ảnh sản phẩm</label>
          <div class="image-upload-area">
            <input
              type="file"
              multiple
              accept="image/*"
              (change)="onFilesSelected($event)"
              id="imageInput"
              class="file-input"
            />
            <label for="imageInput" class="file-label">
              <span class="upload-icon">+</span>
              <span>Chọn ảnh hoặc kéo thả vào đây</span>
            </label>
          </div>
          @if (imagePreviews().length > 0) {
            <div class="image-previews">
              @for (preview of imagePreviews(); track $index) {
                <div class="preview-item">
                  <img [src]="preview" alt="Preview" />
                  <button type="button" class="remove-image" (click)="removeImage($index)">&times;</button>
                </div>
              }
            </div>
          }
        </div>
        <div class="form-group">
          <label class="checkbox-label">
            <input type="checkbox" [(ngModel)]="isActive" />
            Đang bán
          </label>
        </div>
        <div class="form-actions">
          <button class="btn-secondary" routerLink="/merchant/products">Hủy</button>
          <button class="btn-primary" (click)="save()" [disabled]="isLoading">
            {{ isLoading ? 'Đang lưu...' : 'Lưu' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .form-page { padding: 2rem; max-width: 640px; margin: 0 auto; }
    .header { margin-bottom: 1.5rem; }
    .back-link { color: #667eea; text-decoration: none; font-size: 0.875rem; }
    .header h1 { font-size: 1.5rem; color: #1a1a2e; margin: 0.5rem 0 0; }
    .form-card { background: white; border-radius: 0.75rem; padding: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .form-group { margin-bottom: 1rem; }
    .form-group label { display: block; font-size: 0.875rem; font-weight: 500; color: #374151; margin-bottom: 0.375rem; }
    .form-group input, .form-group textarea, .form-group select {
      width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #d1d5db;
      border-radius: 0.5rem; font-size: 0.875rem; box-sizing: border-box; background: white;
    }
    .form-group textarea { resize: vertical; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .form-actions { display: flex; gap: 0.75rem; justify-content: flex-end; margin-top: 1.5rem; }
    .btn-primary, .btn-secondary {
      padding: 0.5rem 1.25rem; border-radius: 0.5rem; font-weight: 500; border: none; cursor: pointer;
    }
    .btn-primary { background: linear-gradient(135deg, #667eea, #764ba2); color: white; }
    .btn-primary:disabled { opacity: 0.5; }
    .validation-errors { background: #fef2f2; border: 1px solid #fee2e2; border-radius: 0.5rem; padding: 0.75rem; margin-bottom: 1rem; }
    .error-item { color: #dc2626; font-size: 0.8125rem; padding: 0.25rem 0; }
    .error-item:not(:last-child) { border-bottom: 1px solid #fee2e2; }
    .btn-secondary { background: #f3f4f6; color: #374151; }
    .checkbox-label { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; }
    .checkbox-label input { width: auto; }
    .image-upload-area { border: 2px dashed #d1d5db; border-radius: 0.75rem; padding: 2rem; text-align: center; cursor: pointer; transition: border-color 0.2s; }
    .image-upload-area:hover { border-color: #667eea; }
    .file-input { display: none; }
    .file-label { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; cursor: pointer; color: #6b7280; }
    .upload-icon { width: 3rem; height: 3rem; border-radius: 50%; background: #f3f4f6; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; color: #667eea; }
    .image-previews { display: flex; gap: 0.75rem; flex-wrap: wrap; margin-top: 0.75rem; }
    .preview-item { position: relative; width: 5rem; height: 5rem; border-radius: 0.5rem; overflow: hidden; border: 1px solid #e5e7eb; }
    .preview-item img { width: 100%; height: 100%; object-fit: cover; }
    .remove-image {
      position: absolute; top: -0.25rem; right: -0.25rem; width: 1.25rem; height: 1.25rem;
      border-radius: 50%; background: #ef4444; color: white; border: none;
      display: flex; align-items: center; justify-content: center; cursor: pointer;
      font-size: 0.75rem; line-height: 1;
    }
  `]
})
export class ProductFormComponent implements OnInit {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  readonly isEditing = !!this.route.snapshot.params['id'];
  readonly isLoading = signal(false);
  readonly merchants = signal<any[]>([]);
  readonly categories = signal<any[]>([]);
  readonly imagePreviews = signal<string[]>([]);
  readonly selectedFiles = signal<File[]>([]);

  nameVi = '';
  nameEn = '';
  price = 0;
  stock = 0;
  sku = '';
  description = '';
  isActive = true;
  selectedMerchantId = '';
  selectedCategoryId = '';
  errors = signal<string[]>([]);

  ngOnInit() {
    // Load categories for dropdown
    this.http.get<any>('/api/categories', { withCredentials: true }).subscribe({
      next: (res: any) => {
        const list = Array.isArray(res) ? res : (res.data || []);
        this.categories.set(list);
      },
    });

    // Load merchants for the current user
    if (!this.isEditing) {
      this.http.get<any>('/api/merchants?limit=100', { withCredentials: true }).subscribe({
        next: (res) => {
          const list = Array.isArray(res) ? res : (res.data || []);
          this.merchants.set(list);
          if (list.length === 1) {
            this.selectedMerchantId = list[0].externalId;
          }
        },
      });
    }
  }

  onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    const files = Array.from(input.files);
    this.selectedFiles.set(files);

    // Generate previews incrementally as each file loads
    this.imagePreviews.set([]);
    for (const file of files) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreviews.update(p => [...p, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage(index: number) {
    const files = this.selectedFiles();
    const previews = this.imagePreviews();
    files.splice(index, 1);
    previews.splice(index, 1);
    this.selectedFiles.set([...files]);
    this.imagePreviews.set([...previews]);
  }

  getCategoryName(cat: any): string {
    if (!cat?.name) return 'Danh mục';
    return cat.name.vi || cat.name.en || cat.name.ko || 'Danh mục';
  }

  validate(): boolean {
    const errs: string[] = [];
    if (!this.nameVi.trim()) errs.push('Tên sản phẩm (Tiếng Việt) là bắt buộc');
    if (!this.price || this.price <= 0) errs.push('Giá sản phẩm phải lớn hơn 0');
    if (this.stock < 0) errs.push('Tồn kho không thể âm');
    if (!this.sku.trim()) errs.push('SKU là bắt buộc');
    this.errors.set(errs);
    return errs.length === 0;
  }

  save() {
    if (!this.validate()) return;

    this.isLoading.set(true);
    const finish = () => this.isLoading.set(false);

    if (this.isEditing) {
      // Edit: JSON body
      const body: any = {
        name: { vi: this.nameVi, en: this.nameEn },
        price: this.price,
        stock: this.stock,
        sku: this.sku,
        description: { vi: this.description },
        isActive: this.isActive,
      };

      this.http.patch(`/api/products/${this.route.snapshot.params['id']}`, body, { withCredentials: true }).subscribe({
        next: () => { finish(); this.router.navigate(['/merchant/products']); },
        error: (err) => { finish(); console.error('Failed to update product', err); },
      });
    } else {
      // Create: FormData for multipart (supports image upload)
      const formData = new FormData();
      formData.append('name', JSON.stringify({ vi: this.nameVi, en: this.nameEn }));
      formData.append('price', String(this.price));
      formData.append('stock', String(this.stock));
      formData.append('sku', this.sku);
      formData.append('description', JSON.stringify({ vi: this.description }));
      formData.append('isActive', String(this.isActive));

      // Append category to metadata
      if (this.selectedCategoryId) {
        const metadata = { categoryId: this.selectedCategoryId };
        formData.append('metadata', JSON.stringify(metadata));
      }

      // Append files
      for (const file of this.selectedFiles()) {
        formData.append('images', file);
      }

      const params = this.selectedMerchantId ? `?merchantId=${this.selectedMerchantId}` : '';
      this.http.post(`/api/products${params}`, formData, { withCredentials: true }).subscribe({
        next: () => { finish(); this.router.navigate(['/merchant/products']); },
        error: (err) => { finish(); console.error('Failed to create product', err); },
      });
    }
  }
}
