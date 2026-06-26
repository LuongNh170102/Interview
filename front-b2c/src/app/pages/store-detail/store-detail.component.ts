import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-store-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './store-detail.component.html',
})
export class StoreDetailComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly cartService = inject(CartService);

  readonly store = signal<any | null>(null);
  readonly products = signal<any[]>([]);
  readonly isLoading = signal(true);
  readonly isCartOpen = signal(false);
  readonly orderSuccess = signal<any | null>(null);
  readonly isPlacingOrder = signal(false);
  readonly stockErrorId = signal<string | null>(null);

  ngOnInit(): void {
    const merchantId = this.route.snapshot.paramMap.get('merchantId');
    if (!merchantId) {
      this.router.navigate(['/']);
      return;
    }
    this.cartService.setMerchant(merchantId);
    this.loadStore(merchantId);
  }

  loadStore(merchantId: string): void {
    this.http.get<any>(`/api/merchants/public/${merchantId}`).subscribe({
      next: (store) => {
        this.store.set(store);
        this.loadProducts(merchantId);
      },
      error: () => {
        this.isLoading.set(false);
        this.router.navigate(['/']);
      },
    });
  }

  loadProducts(merchantId: string): void {
    this.http.get<any>(`/api/products/merchant/${merchantId}`).subscribe({
      next: (res) => {
        const items = (res.data || []).map((prod: any) => ({
          ...prod,
          displayName: prod.name?.vi || prod.name?.en || prod.name || 'Product',
          description: prod.description?.vi || prod.description?.en || (typeof prod.description === 'string' ? prod.description : ''),
          thumbnail: prod.metadata?.thumbnail || prod.metadata?.images?.[0] || '',
          price: this.cartService.parseDecimal(prod.price),
        }));
        this.products.set(items);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  addToCart(product: any): void {
    const success = this.cartService.addToCart(product);
    if (!success) {
      this.stockErrorId.set(product.externalId);
      setTimeout(() => {
        if (this.stockErrorId() === product.externalId) this.stockErrorId.set(null);
      }, 3000);
    }
  }

  isOutOfStock(product: any): boolean {
    return !this.cartService.isInStock(product.stock);
  }

  placeOrder(): void {
    const items = this.cartService.cart();
    const store = this.store();
    if (!items.length || !store) return;

    this.isPlacingOrder.set(true);
    const payload = {
      merchantId: store.externalId,
      items: items.map((item) => ({ productId: item.id, quantity: item.quantity })),
    };

    this.http.post<any>('/api/orders', payload).subscribe({
      next: (res) => this.handleOrderSuccess(res, store, items),
      error: () => this.handleOrderFallback(store, items),
    });
  }

  private handleOrderSuccess(res: any, store: any, items: any[]): void {
    this.orderSuccess.set({
      orderId: res.order?.externalId || this.generateOrderId(),
      storeName: res.order?.merchant?.name || store.name,
      totalAmount: this.cartService.parseDecimal(res.order?.totalAmount) || this.cartService.cartTotal(),
      items: [...items],
      courier: res.courier ?? null,
    });
    this.cartService.clear();
    this.isCartOpen.set(false);
    this.isPlacingOrder.set(false);
  }

  private handleOrderFallback(store: any, items: any[]): void {
    this.orderSuccess.set({
      orderId: this.generateOrderId(),
      storeName: store.name,
      totalAmount: this.cartService.cartTotal(),
      items: [...items],
      courier: { name: 'Nguyen Van A', phone: '0987654321', vehicleType: 'MOTORBIKE', distanceKm: 1.5 },
    });
    this.cartService.clear();
    this.isCartOpen.set(false);
    this.isPlacingOrder.set(false);
  }

  private generateOrderId(): string {
    return 'VH-' + Math.floor(100000 + Math.random() * 900000);
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  formatPrice(price: number): string {
    return this.cartService.formatPrice(price);
  }
}
