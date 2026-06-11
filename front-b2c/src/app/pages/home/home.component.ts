import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';

interface Merchant {
  externalId: string;
  name: string;
  logoUrl: string | null;
  address: string | null;
  averageRating: number;
  totalReviews: number;
  businessCategory: string | null;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="home-page">
      <header class="main-header">
        <div class="container">
          <h1>VHanDelivery</h1>
          <p class="subtitle">Đồ ăn ngon, giao tận nơi</p>
          <div class="search-bar">
            <input type="text" placeholder="Tìm kiếm cửa hàng..." [(ngModel)]="searchTerm" (input)="filterMerchants()" />
          </div>
        </div>
      </header>

      <main class="container">
        <h2>Cửa hàng gần bạn</h2>
        <div class="merchant-grid">
          @for (merchant of filteredMerchants(); track merchant.externalId) {
            <a [routerLink]="['/merchant', merchant.externalId]" class="merchant-card">
              <div class="merchant-logo">
                {{ merchant.name.charAt(0) }}
              </div>
              <div class="merchant-info">
                <h3>{{ merchant.name }}</h3>
                <p class="merchant-address">{{ merchant.address || merchant.businessCategory }}</p>
                <div class="merchant-rating">
                  <span class="stars">&#9733;</span>
                  <span>{{ merchant.averageRating.toFixed(1) }}</span>
                  <span class="review-count">({{ merchant.totalReviews }} đánh giá)</span>
                </div>
              </div>
            </a>
          } @empty {
            <div class="empty-state">Không có cửa hàng nào</div>
          }
        </div>
      </main>
    </div>
  `,
  styles: [`
    .home-page { min-height: 100vh; background: #f8fafc; }
    .container { max-width: 1200px; margin: 0 auto; padding: 0 1rem; }
    .main-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white; padding: 3rem 0; text-align: center;
    }
    .main-header h1 { font-size: 2rem; margin: 0; }
    .subtitle { opacity: 0.9; margin: 0.5rem 0 1.5rem; }
    .search-bar input {
      width: 100%; max-width: 480px; padding: 0.75rem 1rem;
      border-radius: 9999px; border: none; font-size: 1rem;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    h2 { margin: 2rem 0 1rem; color: #1a1a2e; }
    .merchant-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem; }
    .merchant-card {
      background: white; border-radius: 0.75rem; padding: 1.25rem;
      display: flex; gap: 1rem; text-decoration: none; color: inherit;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1); transition: box-shadow 0.2s;
    }
    .merchant-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
    .merchant-logo {
      width: 3.5rem; height: 3.5rem; border-radius: 50%;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white; display: flex; align-items: center; justify-content: center;
      font-size: 1.25rem; font-weight: 700; flex-shrink: 0;
    }
    .merchant-info h3 { margin: 0 0 0.25rem; font-size: 1rem; }
    .merchant-address { color: #6b7280; font-size: 0.875rem; margin: 0 0 0.5rem; }
    .merchant-rating { display: flex; align-items: center; gap: 0.25rem; font-size: 0.875rem; }
    .stars { color: #f59e0b; }
    .review-count { color: #9ca3af; font-size: 0.75rem; }
    .empty-state { grid-column: 1 / -1; text-align: center; color: #9ca3af; padding: 3rem; }
  `]
})
export class HomeComponent implements OnInit {
  private http = inject(HttpClient);
  readonly merchants = signal<Merchant[]>([]);
  readonly filteredMerchants = signal<Merchant[]>([]);
  searchTerm = '';

  ngOnInit() {
    this.loadMerchants();
  }

  private loadMerchants() {
    this.http.get<any>('/api/merchants/b2c?limit=50').subscribe({
      next: (res) => {
        const list = Array.isArray(res) ? res : (res.data || []);
        this.merchants.set(list);
        this.filteredMerchants.set(list);
      },
    });
  }

  filterMerchants() {
    const term = this.searchTerm.toLowerCase();
    this.filteredMerchants.set(
      this.merchants().filter((m) => m.name.toLowerCase().includes(term))
    );
  }
}
