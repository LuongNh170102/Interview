import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  thumbnail?: string;
}

@Component({
  selector: 'app-storefront',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './storefront.component.html',
  styleUrls: [],
})
export class StorefrontComponent implements OnInit {
  private readonly http = inject(HttpClient);

  // States
  readonly stores = signal<any[]>([]);
  readonly selectedStore = signal<any | null>(null);
  readonly products = signal<any[]>([]);
  readonly cart = signal<CartItem[]>([]);
  readonly isCartOpen = signal(false);
  readonly orderSuccess = signal<any | null>(null);
  readonly searchQuery = signal('');
  readonly isLoading = signal(false);

  // Stats computed
  readonly cartItemCount = computed(() => {
    return this.cart().reduce((sum, item) => sum + item.quantity, 0);
  });

  readonly cartSubtotal = computed(() => {
    return this.cart().reduce((sum, item) => sum + item.price * item.quantity, 0);
  });

  readonly deliveryFee = computed(() => {
    return this.cart().length > 0 ? 15000 : 0; // 15k VNĐ delivery fee
  });

  readonly cartTax = computed(() => {
    return Math.round(this.cartSubtotal() * 0.1); // 10% VAT
  });

  readonly cartTotal = computed(() => {
    return this.cartSubtotal() + this.deliveryFee() + this.cartTax();
  });

  // Filtered stores based on search query
  readonly filteredStores = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return this.stores();
    return this.stores().filter((store) =>
      store.name.toLowerCase().includes(query) ||
      (store.businessCategory && store.businessCategory.toLowerCase().includes(query))
    );
  });

  ngOnInit(): void {
    this.loadStores();
  }

  loadStores(): void {
    this.isLoading.set(true);
    this.http.get<any[]>('/api/merchants/public/list').subscribe({
      next: (data) => {
        this.stores.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load stores:', err);
        this.isLoading.set(false);
      },
    });
  }

  selectStore(store: any): void {
    this.selectedStore.set(store);
    this.loadProducts(store.externalId);
  }

  deselectStore(): void {
    this.selectedStore.set(null);
    this.products.set([]);
  }

  loadProducts(merchantId: string): void {
    this.isLoading.set(true);
    this.http.get<any>(`/api/products/merchant/${merchantId}`).subscribe({
      next: (res) => {
        // Map products
        const items = (res.data || []).map((prod: any) => {
          let thumbnail = '';
          if (prod.metadata && prod.metadata.images && prod.metadata.images.length > 0) {
            thumbnail = prod.metadata.images[0];
          }
          // Parse localized name
          let name = 'Product';
          if (prod.name) {
            name = prod.name.vi || prod.name.en || prod.name;
          }
          return {
            ...prod,
            displayName: name,
            thumbnail,
            price: prod.price || 50000, // fallback price
          };
        });
        this.products.set(items);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load products:', err);
        this.isLoading.set(false);
      },
    });
  }

  addToCart(product: any): void {
    this.cart.update((current) => {
      const idx = current.findIndex((item) => item.id === product.externalId);
      if (idx > -1) {
        const updated = [...current];
        updated[idx] = {
          ...updated[idx],
          quantity: updated[idx].quantity + 1,
        };
        return updated;
      } else {
        return [
          ...current,
          {
            id: product.externalId,
            name: product.displayName,
            price: product.price,
            quantity: 1,
            thumbnail: product.thumbnail,
          },
        ];
      }
    });
  }

  updateQuantity(itemId: string, delta: number): void {
    this.cart.update((current) => {
      return current
        .map((item) => {
          if (item.id === itemId) {
            return { ...item, quantity: item.quantity + delta };
          }
          return item;
        })
        .filter((item) => item.quantity > 0);
    });
  }

  removeFromCart(itemId: string): void {
    this.cart.update((current) => current.filter((item) => item.id !== itemId));
  }

  toggleCart(): void {
    this.isCartOpen.update((open) => !open);
  }

  placeOrder(): void {
    if (this.cart().length === 0) return;

    this.isLoading.set(true);
    // Simulate order placement
    setTimeout(() => {
      this.orderSuccess.set({
        orderId: 'VH-' + Math.floor(100000 + Math.random() * 90000),
        storeName: this.selectedStore()?.name || 'VHan Store',
        totalAmount: this.cartTotal(),
        items: [...this.cart()],
      });
      this.cart.set([]);
      this.isLoading.set(false);
      this.isCartOpen.set(false);
    }, 1500);
  }

  closeOrderSuccess(): void {
    this.orderSuccess.set(null);
  }

  formatPrice(price: number): string {
    return price.toLocaleString('vi-VN') + ' đ';
  }
}
