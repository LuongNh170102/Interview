import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="detail-page">
      <div class="container">
        <a routerLink=".." class="back-link">&larr; Quay lại</a>

        @if (product(); as p) {
          <div class="product-detail">
            <div class="product-image-section">
              <div class="product-image">🍕</div>
            </div>
            <div class="product-info-section">
              <h1>{{ getProductName(p.name) }}</h1>
              <div class="rating">
                <span class="stars">&#9733;</span>
                <span>{{ p.averageRating.toFixed(1) }}</span>
                <span class="count">({{ p.totalReviews }} đánh giá)</span>
              </div>
              <div class="price">{{ formatPrice(p.price) }}</div>
              @if (p.description) {
                <p class="description">{{ getDescription(p.description) }}</p>
              }
              <div class="stock-info">
                @if (p.stock > 0) {
                  <span class="in-stock">Còn hàng ({{ p.stock }})</span>
                } @else {
                  <span class="out-of-stock">Hết hàng</span>
                }
              </div>
              <button class="add-to-cart-btn" (click)="addToCart(p.externalId)" [disabled]="p.stock <= 0">
                Thêm vào giỏ hàng
              </button>

              @if (p.merchant) {
                <div class="merchant-info">
                  <h3>{{ p.merchant.name }}</h3>
                  <p>{{ p.merchant.address }}</p>
                </div>
              }

              @if (toastMessage(); as msg) {
                <div class="toast" [class.toast-success]="msg.type === 'success'" [class.toast-error]="msg.type === 'error'">
                  {{ msg.text }}
                </div>
              }
            </div>
          </div>
        } @else {
          <div class="loading">Đang tải...</div>
        }
      </div>
    </div>
  `,
  styles: [`
    .detail-page { min-height: 100vh; background: #f8fafc; }
    .container { max-width: 1200px; margin: 0 auto; padding: 1.5rem 1rem; }
    .back-link { color: #667eea; text-decoration: none; font-size: 0.875rem; }
    .product-detail { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-top: 1rem; }
    .product-image-section { background: white; border-radius: 0.75rem; padding: 2rem; display: flex; align-items: center; justify-content: center; min-height: 300px; }
    .product-image { font-size: 6rem; }
    .product-info-section h1 { margin: 0 0 0.5rem; font-size: 1.5rem; color: #1a1a2e; }
    .rating { display: flex; align-items: center; gap: 0.25rem; margin-bottom: 1rem; }
    .stars { color: #f59e0b; }
    .count { color: #9ca3af; font-size: 0.875rem; }
    .price { font-size: 1.5rem; font-weight: 700; color: #059669; margin-bottom: 1rem; }
    .description { color: #6b7280; line-height: 1.6; margin-bottom: 1rem; }
    .stock-info { margin-bottom: 1rem; }
    .in-stock { color: #059669; font-weight: 500; }
    .out-of-stock { color: #dc2626; font-weight: 500; }
    .add-to-cart-btn {
      padding: 0.75rem 2rem; background: linear-gradient(135deg, #667eea, #764ba2);
      color: white; border: none; border-radius: 0.5rem; font-weight: 600; cursor: pointer;
      transition: box-shadow 0.2s;
    }
    .add-to-cart-btn:hover { box-shadow: 0 4px 12px rgba(102,126,234,0.4); }
    .add-to-cart-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .merchant-info { margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #e5e7eb; }
    .merchant-info h3 { margin: 0 0 0.25rem; color: #1a1a2e; }
    .merchant-info p { margin: 0; color: #6b7280; font-size: 0.875rem; }
    .loading { text-align: center; padding: 4rem; color: #9ca3af; }
    .toast {
      position: fixed; top: 1rem; right: 1rem; padding: 0.75rem 1.25rem;
      border-radius: 0.5rem; font-weight: 500; z-index: 9999;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15); animation: slideIn 0.3s ease;
    }
    .toast-success { background: #059669; color: white; }
    .toast-error { background: #dc2626; color: white; }
    @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    @media (max-width: 768px) { .product-detail { grid-template-columns: 1fr; } }
  `]
})
export class ProductDetailComponent implements OnInit {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);

  readonly product = signal<any>(null);
  readonly toastMessage = signal<{ text: string; type: 'success' | 'error' } | null>(null);
  private toastTimeout: ReturnType<typeof setTimeout> | null = null;

  ngOnInit() {
    const id = this.route.snapshot.params['id'];
    this.http.get(`/api/products/b2c/${id}`).subscribe({
      next: (data) => this.product.set(data),
    });
  }

  private showToast(text: string, type: 'success' | 'error') {
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastMessage.set({ text, type });
    this.toastTimeout = setTimeout(() => this.toastMessage.set(null), 3000);
  }

  getProductName(name: any): string {
    return name?.vi || name?.en || 'Sản phẩm';
  }

  getDescription(desc: any): string {
    return desc?.vi || desc?.en || '';
  }

  formatPrice(price: string): string {
    return Number(price).toLocaleString('vi-VN') + ' ₫';
  }

  addToCart(productId: string) {
    this.http.post('/api/carts/add', { productId, quantity: 1 }, { withCredentials: true }).subscribe({
      next: () => this.showToast('Đã thêm vào giỏ hàng!', 'success'),
      error: () => this.showToast('Vui lòng đăng nhập để thêm vào giỏ hàng', 'error'),
    });
  }
}
