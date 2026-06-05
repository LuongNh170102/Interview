import { Injectable, computed, inject, signal } from '@angular/core';
import { CartResponse, OrderService } from '@vhandelivery/shared-ui';
import { Observable, tap } from 'rxjs';

const MERCHANT_KEY = 'b2c_merchant_id';

@Injectable({ providedIn: 'root' })
export class CartStateService {
  private readonly orderService = inject(OrderService);

  readonly merchantId = signal(this.readMerchantId());
  readonly cart = signal<CartResponse | null>(null);
  readonly isLoading = signal(false);
  readonly itemCount = computed(
    () =>
      this.cart()?.cartItems?.reduce(
        (sum, item) => sum + (item.quantity ?? 0),
        0
      ) ?? 0
  );

  setMerchantId(merchantId: string): void {
    this.merchantId.set(merchantId);
    sessionStorage.setItem(MERCHANT_KEY, merchantId);
  }

  loadCart(): Observable<CartResponse> {
    const merchantId = this.merchantId();
    this.isLoading.set(true);
    return this.orderService.getCart(merchantId).pipe(
      tap({
        next: (cart) => {
          this.cart.set(cart);
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
        },
      })
    );
  }

  updateCart(cart: CartResponse): void {
    this.cart.set(cart);
  }

  clear(): void {
    this.cart.set({ cartItems: [], totalAmount: 0 });
  }

  private readMerchantId(): string {
    return sessionStorage.getItem(MERCHANT_KEY) ?? '';
  }
}
