import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';

interface Product {
  externalId: string;
  name: any;
  price: string;
  stock: number;
  isActive: boolean;
  createdAt: string;
}

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="products-page">
      <div class="header">
        <h1>Quản lý sản phẩm</h1>
        <a routerLink="/merchant/products/create" class="btn-primary">+ Thêm sản phẩm</a>
      </div>

      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Tên sản phẩm</th>
              <th>Giá</th>
              <th>Tồn kho</th>
              <th>Trạng thái</th>
              <th>Ngày tạo</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            @for (product of products(); track product.externalId) {
              <tr>
                <td>{{ getProductName(product.name) }}</td>
                <td>{{ formatPrice(product.price) }}</td>
                <td>{{ product.stock }}</td>
                <td>
                  <span class="status-badge" [class.active]="product.isActive">
                    {{ product.isActive ? 'Đang bán' : 'Ngừng bán' }}
                  </span>
                </td>
                <td>{{ product.createdAt | date: 'dd/MM/yyyy' }}</td>
                <td class="actions-cell">
                  <a [routerLink]="['/merchant/products', product.externalId, 'edit']" class="btn-edit">Sửa</a>
                  <button class="btn-delete" (click)="deleteProduct(product.externalId)">Xóa</button>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="6" class="empty-state">Chưa có sản phẩm nào</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .products-page { padding: 2rem; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .header h1 { font-size: 1.5rem; margin: 0; color: #1a1a2e; }
    .btn-primary {
      padding: 0.5rem 1.25rem; background: linear-gradient(135deg, #667eea, #764ba2);
      color: white; border-radius: 0.5rem; text-decoration: none; font-weight: 500;
    }
    .table-container { background: white; border-radius: 0.75rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 0.75rem 1rem; text-align: left; border-bottom: 1px solid #f3f4f6; }
    th { background: #f9fafb; font-weight: 600; font-size: 0.875rem; color: #6b7280; }
    .status-badge { padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; background: #fee2e2; color: #dc2626; }
    .status-badge.active { background: #d1fae5; color: #059669; }
    .actions-cell { display: flex; gap: 0.5rem; align-items: center; }
    .btn-edit { color: #667eea; text-decoration: none; font-weight: 500; font-size: 0.875rem; }
    .btn-delete { color: #ef4444; background: none; border: none; cursor: pointer; font-size: 0.875rem; font-weight: 500; padding: 0; }
    .btn-delete:hover { text-decoration: underline; }
    .empty-state { text-align: center; color: #9ca3af; padding: 3rem !important; }
  `]
})
export class ProductsComponent implements OnInit {
  private http = inject(HttpClient);
  readonly products = signal<Product[]>([]);

  ngOnInit() {
    this.loadProducts();
  }

  private loadProducts() {
    this.http.get<any[]>('/api/products').subscribe({
      next: (data) => this.products.set(data),
      error: () => console.error('Failed to load products'),
    });
  }

  getProductName(name: any): string {
    return name?.vi || name?.en || 'Unknown';
  }

  formatPrice(price: string): string {
    const num = Number(price);
    return num.toLocaleString('vi-VN') + ' ₫';
  }

  deleteProduct(externalId: string) {
    if (confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
      this.http.delete(`/api/products/${externalId}`, { withCredentials: true }).subscribe({
        next: () => {
          this.products.update((list) => list.filter((p) => p.externalId !== externalId));
        },
        error: (err) => {
          console.error('Failed to delete product', err);
          alert('Xóa sản phẩm thất bại');
        },
      });
    }
  }
}
