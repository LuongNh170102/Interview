import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';

interface ProductItem {
  externalId: string;
  name: any;
  price: string;
  currency: string;
  averageRating: number;
  totalReviews: number;
  metadata: any;
}

@Component({
  selector: 'app-merchant-products',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="products-page">
      <header class="page-header">
        <a routerLink="/" class="back-link">&larr; Trang chủ</a>
        <h1>{{ merchantName }}</h1>
      </header>

      <div class="product-grid">
        @for (product of products(); track product.externalId) {
          <a [routerLink]="['/product', product.externalId]" class="product-card">
            <div class="product-image">
              <div class="image-placeholder">🍕</div>
            </div>
            <div class="product-info">
              <h3>{{ getProductName(product.name) }}</h3>
              <div class="product-rating">
                <span>&#9733; {{ product.averageRating.toFixed(1) }}</span>
                <span class="count">({{ product.totalReviews }})</span>
              </div>
              <div class="product-price">{{ formatPrice(product.price) }}</div>
            </div>
          </a>
        } @empty {
          <div class="empty-state">Cửa hàng chưa có sản phẩm nào</div>
        }
      </div>
    </div>
  `,
  styles: [`
    .products-page { min-height: 100vh; background: #f8fafc; }
    .page-header { max-width: 1200px; margin: 0 auto; padding: 1.5rem 1rem 0; }
    .back-link { color: #667eea; text-decoration: none; font-size: 0.875rem; }
    .page-header h1 { margin: 0.5rem 0 1.5rem; font-size: 1.5rem; color: #1a1a2e; }
    .product-grid { max-width: 1200px; margin: 0 auto; padding: 0 1rem 2rem; display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1rem; }
    .product-card {
      background: white; border-radius: 0.75rem; overflow: hidden;
      text-decoration: none; color: inherit; box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      transition: box-shadow 0.2s;
    }
    .product-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
    .product-image { height: 160px; background: #f3f4f6; display: flex; align-items: center; justify-content: center; }
    .image-placeholder { font-size: 3rem; }
    .product-info { padding: 1rem; }
    .product-info h3 { margin: 0 0 0.5rem; font-size: 1rem; }
    .product-rating { display: flex; align-items: center; gap: 0.25rem; font-size: 0.875rem; color: #f59e0b; margin-bottom: 0.5rem; }
    .product-rating .count { color: #9ca3af; }
    .product-price { font-weight: 700; color: #1a1a2e; font-size: 1.125rem; }
    .empty-state { grid-column: 1 / -1; text-align: center; color: #9ca3af; padding: 3rem; }
  `]
})
export class MerchantProductsComponent implements OnInit {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);

  readonly products = signal<ProductItem[]>([]);
  merchantName = '';

  ngOnInit() {
    const merchantId = this.route.snapshot.params['merchantId'];
    this.http.get<any>(`/api/products/b2c/merchant/${merchantId}`).subscribe({
      next: (res) => {
        this.products.set(res.data || []);
        this.merchantName = 'Cửa hàng';
      },
    });
  }

  getProductName(name: any): string {
    return name?.vi || name?.en || 'Sản phẩm';
  }

  formatPrice(price: string): string {
    const num = Number(price);
    return num.toLocaleString('vi-VN') + ' ₫';
  }
}
