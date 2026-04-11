import { Injectable, signal, computed } from '@angular/core';

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  thumbnail?: string;
  quantity: number;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly cartItems = signal<CartItem[]>([]);

  readonly items = this.cartItems.asReadonly();
  readonly totalItems = computed(() =>
    this.cartItems().reduce((sum, item) => sum + item.quantity, 0)
  );

  readonly totalPrice = computed(() =>
    this.cartItems().reduce((sum, item) => sum + item.price * item.quantity, 0)
  );

  addToCart(item: Omit<CartItem, 'quantity'> & { quantity?: number }) {
    this.cartItems.update((items) => {
      const existing = items.findIndex((i) => i.productId === item.productId);

      if (existing !== -1) {
        items[existing].quantity += item.quantity || 1;
        return [...items];
      } else {
        return [...items, { ...item, quantity: item.quantity || 1 }];
      }
    });
  }

  removeFromCart(productId: string) {
    this.cartItems.update((items) =>
      items.filter((i) => i.productId !== productId)
    );
  }

  updateQuantity(productId: string, quantity: number) {
    if (quantity < 1) return;
    this.cartItems.update((items) =>
      items.map((item) =>
        item.productId === productId ? { ...item, quantity } : item
      )
    );
  }

  clearCart() {
    this.cartItems.set([]);
  }
}
