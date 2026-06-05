import { computed, inject, Injectable, signal } from '@angular/core';
import {
  coerceNumericValue,
  ProductResponse,
  TranslationService,
} from '@vhandelivery/shared-ui';

export interface CartLineItem {
  productId: string;
  merchantId: string;
  merchantName: string;
  name: string;
  price: number;
  currency: string;
  thumbnail: string | null;
  quantity: number;
}

@Injectable({ providedIn: 'root' })
export class CartStore {
  private readonly storageKey = 'sharkbee-b2c-cart';
  private readonly translationService = inject(TranslationService);
  readonly items = signal<CartLineItem[]>(this.read());
  readonly totalItems = computed(() =>
    this.items().reduce((sum, item) => sum + item.quantity, 0)
  );
  readonly subtotal = computed(() =>
    this.items().reduce((sum, item) => sum + item.price * item.quantity, 0)
  );

  addProduct(
    product: ProductResponse,
    quantity = 1
  ): { replacedMerchant: boolean } {
    const merchantId = product.merchant?.externalId;
    if (!merchantId) {
      return { replacedMerchant: false };
    }

    const nextItem: CartLineItem = {
      productId: product.externalId,
      merchantId,
      merchantName:
        product.merchant?.name ??
        this.translationService.translate('b2c.common.store'),
      name: this.readLocalized(product.name),
      price: coerceNumericValue(product.price) ?? 0,
      currency: product.currency ?? 'VND',
      thumbnail: product.thumbnail,
      quantity,
    };

    let replacedMerchant = false;

    this.items.update((current) => {
      if (current.length > 0 && current[0].merchantId !== merchantId) {
        replacedMerchant = true;
        return [nextItem];
      }

      const existing = current.find(
        (item) => item.productId === product.externalId
      );
      if (!existing) {
        return [...current, nextItem];
      }

      return current.map((item) =>
        item.productId === product.externalId
          ? { ...item, quantity: item.quantity + quantity }
          : item
      );
    });

    this.persist();
    return { replacedMerchant };
  }

  updateQuantity(productId: string, quantity: number): void {
    if (quantity <= 0) {
      this.remove(productId);
      return;
    }

    this.items.update((current) =>
      current.map((item) =>
        item.productId === productId ? { ...item, quantity } : item
      )
    );
    this.persist();
  }

  remove(productId: string): void {
    this.items.update((current) =>
      current.filter((item) => item.productId !== productId)
    );
    this.persist();
  }

  clear(): void {
    this.items.set([]);
    this.persist();
  }

  private persist(): void {
    globalThis.localStorage?.setItem(
      this.storageKey,
      JSON.stringify(this.items())
    );
  }

  private read(): CartLineItem[] {
    const raw = globalThis.localStorage?.getItem(this.storageKey);
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as CartLineItem[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private readLocalized(value: ProductResponse['name']): string {
    return (
      this.translationService.getLocalizedValue(value, 'vi') ||
      this.translationService.translate('b2c.common.product')
    );
  }
}
