import { Injectable, signal, computed } from '@angular/core';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  thumbnail?: string;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly _cart = signal<CartItem[]>([]);
  private readonly _merchantId = signal<string | null>(null);

  readonly cart = this._cart.asReadonly();
  readonly merchantId = this._merchantId.asReadonly();

  readonly cartItemCount = computed(() =>
    this._cart().reduce((sum, item) => sum + item.quantity, 0)
  );

  readonly cartSubtotal = computed(() =>
    this._cart().reduce((sum, item) => sum + item.price * item.quantity, 0)
  );

  readonly deliveryFee = computed(() => (this._cart().length > 0 ? 15000 : 0));

  readonly cartTax = computed(() => Math.round(this.cartSubtotal() * 0.1));

  readonly cartTotal = computed(
    () => this.cartSubtotal() + this.deliveryFee() + this.cartTax()
  );

  isInStock(stock: any): boolean {
    if (stock === null || stock === undefined) return false;
    return Number(stock) > 0;
  }

  addToCart(product: any): boolean {
    if (!this.isInStock(product.stock)) return false;

    this._merchantId.set(product.merchantExternalId || this._merchantId());
    this._cart.update((current) => {
      const idx = current.findIndex((item) => item.id === product.externalId);
      if (idx > -1) {
        const updated = [...current];
        updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + 1 };
        return updated;
      }
      return [
        ...current,
        {
          id: product.externalId,
          name: product.displayName || product.name?.vi || product.name,
          price: product.price,
          quantity: 1,
          thumbnail: product.thumbnail,
        },
      ];
    });
    return true;
  }

  updateQuantity(itemId: string, delta: number): void {
    this._cart.update((current) =>
      current
        .map((item) =>
          item.id === itemId ? { ...item, quantity: item.quantity + delta } : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  removeFromCart(itemId: string): void {
    this._cart.update((current) => current.filter((item) => item.id !== itemId));
  }

  clear(): void {
    this._cart.set([]);
    this._merchantId.set(null);
  }

  setMerchant(id: string): void {
    this._merchantId.set(id);
  }

  formatPrice(price: number): string {
    return price.toLocaleString('vi-VN') + ' đ';
  }

  parseDecimal(val: any): number {
    if (val === null || val === undefined) return 0;
    if (typeof val === 'object') {
      if (typeof val.toNumber === 'function') return val.toNumber();
      if (typeof val.toFixed === 'function') return Number(val.toFixed());
      if (val.d && Array.isArray(val.d)) return Number(val.d[0] || 0);
      return Number(val.toString() || 0);
    }
    return Number(val);
  }
}
