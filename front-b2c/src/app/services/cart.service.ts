import { Injectable, signal, computed } from '@angular/core';
import { B2CProduct } from './product.service';

export interface CartItem {
  product: B2CProduct;
  quantity: number;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  readonly items = signal<CartItem[]>([]);

  readonly total = computed(() =>
    this.items().reduce((sum, item) => sum + (item.product.price ?? 0) * item.quantity, 0)
  );

  readonly count = computed(() =>
    this.items().reduce((sum, item) => sum + item.quantity, 0)
  );

  addToCart(product: B2CProduct): void {
    this.items.update(items => {
      const existing = items.find(i => i.product.externalId === product.externalId);
      if (existing) {
        return items.map(i =>
          i.product.externalId === product.externalId
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...items, { product, quantity: 1 }];
    });
  }

  removeFromCart(externalId: string): void {
    this.items.update(items => items.filter(i => i.product.externalId !== externalId));
  }

  updateQuantity(externalId: string, quantity: number): void {
    if (quantity <= 0) { this.removeFromCart(externalId); return; }
    this.items.update(items =>
      items.map(i => i.product.externalId === externalId ? { ...i, quantity } : i)
    );
  }

  clearCart(): void {
    this.items.set([]);
  }
}