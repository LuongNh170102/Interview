import { computed, Injectable, signal } from '@angular/core';
import { DecimalResponse, ProductResponse } from '@vhandelivery/shared-ui';

export interface CartItem {
  product: ProductResponse;
  quantity: number;
}

const STORAGE_KEY = 'sharkbee_b2c_cart';

export function parseProductPrice(price: ProductResponse['price']): number {
  if (typeof price === 'number') {
    return price;
  }
  if (typeof price === 'string') {
    return Number(price) || 0;
  }
  if (price && typeof price === 'object') {
    const decimal = price as DecimalResponse;
    const digits =
      typeof decimal.d === 'string' ? decimal.d : decimal.d?.join('') ?? '0';
    const exponent = decimal.e ?? digits.length - 1;
    return (
      Number(digits) *
      Math.sign(decimal.s ?? 1) *
      10 ** (exponent - digits.length + 1)
    );
  }
  return 0;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly itemsSignal = signal<CartItem[]>(this.readItems());

  readonly items = this.itemsSignal.asReadonly();
  readonly count = computed(() =>
    this.itemsSignal().reduce((total, item) => total + item.quantity, 0)
  );
  readonly merchantExternalId = computed(
    () => this.itemsSignal()[0]?.product.merchant?.externalId ?? null
  );
  readonly total = computed(() =>
    this.itemsSignal().reduce(
      (total, item) => total + this.getPrice(item.product) * item.quantity,
      0
    )
  );

  addItem(product: ProductResponse, quantity = 1): { ok: boolean; reason?: string } {
    if (!product.merchant?.externalId) {
      return { ok: false, reason: 'Sản phẩm thiếu thông tin cửa hàng.' };
    }

    const existingMerchantId = this.merchantExternalId();
    if (existingMerchantId && existingMerchantId !== product.merchant.externalId) {
      return {
        ok: false,
        reason: 'Giỏ hàng chỉ hỗ trợ một cửa hàng cho mỗi đơn.',
      };
    }

    const safeQuantity = Math.max(1, quantity);
    const next = [...this.itemsSignal()];
    const existing = next.find(
      (item) => item.product.externalId === product.externalId
    );

    if (existing) {
      existing.quantity += safeQuantity;
    } else {
      next.push({ product, quantity: safeQuantity });
    }

    this.setItems(next);
    return { ok: true };
  }

  updateQuantity(productExternalId: string, quantity: number): void {
    const safeQuantity = Math.max(1, quantity);
    this.setItems(
      this.itemsSignal().map((item) =>
        item.product.externalId === productExternalId
          ? { ...item, quantity: safeQuantity }
          : item
      )
    );
  }

  removeItem(productExternalId: string): void {
    this.setItems(
      this.itemsSignal().filter(
        (item) => item.product.externalId !== productExternalId
      )
    );
  }

  clear(): void {
    this.setItems([]);
  }

  private getPrice(product: ProductResponse): number {
    return parseProductPrice(product.price);
  }

  private setItems(items: CartItem[]): void {
    this.itemsSignal.set(items);
    this.writeItems(items);
  }

  private readItems(): CartItem[] {
    if (typeof localStorage === 'undefined') {
      return [];
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private writeItems(items: CartItem[]): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }
}
