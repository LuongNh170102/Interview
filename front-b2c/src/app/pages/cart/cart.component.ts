import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="cart-page">
      <div class="container">
        <div class="header">
          <a routerLink="/" class="back-link">&larr; Tiếp tục mua sắm</a>
          <h1>Giỏ hàng</h1>
        </div>

        @if (cart(); as c) {
          @if (c.cartItems && c.cartItems.length > 0) {
            <div class="cart-items">
              @for (item of c.cartItems; track item.id) {
                <div class="cart-item">
                  <div class="item-info">
                    <div class="item-icon">🍕</div>
                    <div class="item-details">
                      <h3>{{ getItemName(item) }}</h3>
                      <div class="item-price">{{ formatPrice(item.price) }}</div>
                    </div>
                  </div>
                  <div class="item-quantity">
                    <span>Số lượng: {{ item.quantity }}</span>
                  </div>
                  <div class="item-total">{{ formatPrice(item.price * item.quantity) }}</div>
                </div>
              }
            </div>
            <div class="cart-summary">
              <div class="total-row">
                <span>Tổng cộng:</span>
                <span class="total-amount">{{ formatPrice(c.totalAmount) }}</span>
              </div>

              @if (showAddressForm()) {
                <div class="address-form">
                  <label for="deliveryAddress">Địa chỉ giao hàng</label>
                  <textarea
                    id="deliveryAddress"
                    [(ngModel)]="deliveryAddress"
                    placeholder="Nhập địa chỉ giao hàng..."
                    rows="2"
                  ></textarea>
                  <div class="address-actions">
                    <button class="btn-cancel" (click)="cancelCheckout()">Hủy</button>
                    <button class="checkout-btn" (click)="confirmCheckout()" [disabled]="!deliveryAddress.trim()">
                      Xác nhận đặt hàng
                    </button>
                  </div>
                </div>
              } @else {
                <button class="checkout-btn" (click)="showCheckoutForm()">Đặt hàng</button>
              }
            </div>
          } @else {
            <div class="empty-cart">
              <p>Giỏ hàng trống</p>
              <a routerLink="/" class="browse-link">Mua sắm ngay</a>
            </div>
          }
        } @else {
          <div class="loading">Đang tải...</div>
        }
      </div>

      @if (toastMessage(); as msg) {
        <div class="toast" [class.toast-success]="msg.type === 'success'" [class.toast-error]="msg.type === 'error'">
          {{ msg.text }}
        </div>
      }
    </div>
  `,
  styles: [`
    .cart-page { min-height: 100vh; background: #f8fafc; }
    .container { max-width: 800px; margin: 0 auto; padding: 1.5rem 1rem; }
    .header { margin-bottom: 1.5rem; }
    .back-link { color: #667eea; text-decoration: none; font-size: 0.875rem; }
    .header h1 { margin: 0.5rem 0 0; color: #1a1a2e; }
    .cart-items { display: flex; flex-direction: column; gap: 0.75rem; }
    .cart-item {
      background: white; border-radius: 0.75rem; padding: 1rem;
      display: flex; align-items: center; gap: 1rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .item-info { display: flex; align-items: center; gap: 0.75rem; flex: 1; }
    .item-icon { font-size: 2rem; }
    .item-details h3 { margin: 0; font-size: 0.9375rem; }
    .item-price { color: #6b7280; font-size: 0.8125rem; }
    .item-quantity { color: #6b7280; font-size: 0.875rem; text-align: center; }
    .item-total { font-weight: 600; color: #1a1a2e; min-width: 80px; text-align: right; }
    .cart-summary {
      margin-top: 1.5rem; background: white; border-radius: 0.75rem;
      padding: 1.25rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .total-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; font-size: 1.125rem; }
    .total-amount { font-weight: 700; color: #1a1a2e; font-size: 1.25rem; }
    .checkout-btn {
      width: 100%; padding: 0.75rem; background: linear-gradient(135deg, #667eea, #764ba2);
      color: white; border: none; border-radius: 0.5rem; font-weight: 600; cursor: pointer;
    }
    .checkout-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .address-form { margin-top: 1rem; }
    .address-form label { display: block; font-size: 0.875rem; font-weight: 500; color: #374151; margin-bottom: 0.375rem; }
    .address-form textarea {
      width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #d1d5db;
      border-radius: 0.5rem; font-size: 0.875rem; resize: vertical; box-sizing: border-box;
    }
    .address-form textarea:focus { outline: none; border-color: #667eea; box-shadow: 0 0 0 3px rgba(102,126,234,0.1); }
    .address-actions { display: flex; gap: 0.75rem; margin-top: 0.75rem; }
    .btn-cancel {
      flex: 1; padding: 0.75rem; background: #f3f4f6; color: #374151;
      border: none; border-radius: 0.5rem; font-weight: 500; cursor: pointer;
    }
    .empty-cart { text-align: center; padding: 4rem; color: #9ca3af; }
    .browse-link { display: inline-block; margin-top: 1rem; color: #667eea; text-decoration: none; font-weight: 500; }
    .loading { text-align: center; padding: 4rem; color: #9ca3af; }
    .toast {
      position: fixed; top: 1rem; right: 1rem; padding: 0.75rem 1.25rem;
      border-radius: 0.5rem; font-weight: 500; z-index: 9999;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15); animation: slideIn 0.3s ease;
    }
    .toast-success { background: #059669; color: white; }
    .toast-error { background: #dc2626; color: white; }
    @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
  `]
})
export class CartComponent implements OnInit {
  private http = inject(HttpClient);
  readonly cart = signal<any>(null);
  readonly showAddressForm = signal(false);
  readonly toastMessage = signal<{ text: string; type: 'success' | 'error' } | null>(null);
  deliveryAddress = '';
  private toastTimeout: ReturnType<typeof setTimeout> | null = null;

  ngOnInit() {
    this.loadCart();
  }

  private loadCart() {
    this.http.get('/api/carts/mine', { withCredentials: true }).subscribe({
      next: (data) => this.cart.set(data),
    });
  }

  private showToast(text: string, type: 'success' | 'error') {
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastMessage.set({ text, type });
    this.toastTimeout = setTimeout(() => this.toastMessage.set(null), 3000);
  }

  getItemName(item: any): string {
    return item.product?.name?.vi || item.product?.name?.en || 'Sản phẩm';
  }

  formatPrice(price: number | string): string {
    return Number(price).toLocaleString('vi-VN') + ' ₫';
  }

  showCheckoutForm() {
    this.showAddressForm.set(true);
  }

  cancelCheckout() {
    this.showAddressForm.set(false);
    this.deliveryAddress = '';
  }

  confirmCheckout() {
    if (!this.deliveryAddress.trim()) return;

    this.http.post('/api/orders', { deliveryAddress: this.deliveryAddress }, { withCredentials: true }).subscribe({
      next: (res: any) => {
        this.showToast(
          res.courierAssigned
            ? `Đặt hàng thành công! ${res.courierMessage}`
            : `Đặt hàng thành công! ${res.courierMessage}`,
          'success'
        );
        this.showAddressForm.set(false);
        this.deliveryAddress = '';
        this.loadCart();
      },
      error: () => this.showToast('Đặt hàng thất bại. Vui lòng thử lại.', 'error'),
    });
  }
}
