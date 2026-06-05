import { TestBed } from '@angular/core/testing';
import { ProductResponse } from '@vhandelivery/shared-ui';
import { CartService } from './cart.service';

const product = (
  externalId: string,
  merchantExternalId = 'merchant-1'
): ProductResponse => ({
  id: 1,
  externalId,
  merchantId: 1,
  merchant: {
    id: 1,
    externalId: merchantExternalId,
    name: { vi: 'Cửa hàng demo' },
  },
  name: { vi: 'Sản phẩm demo' },
  price: { s: 1, e: 4, d: [10000] },
  currency: 'VND',
  stock: 10,
  isActive: true,
  createdAt: new Date().toISOString(),
});

describe('CartService', () => {
  let service: CartService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(CartService);
  });

  it('merges quantity when adding the same product', () => {
    service.addItem(product('product-1'));
    service.addItem(product('product-1'), 2);

    expect(service.items()).toHaveLength(1);
    expect(service.items()[0].quantity).toBe(3);
    expect(service.count()).toBe(3);
    expect(service.total()).toBe(30000);
  });

  it('rejects products from another merchant', () => {
    service.addItem(product('product-1', 'merchant-1'));

    const result = service.addItem(product('product-2', 'merchant-2'));

    expect(result.ok).toBe(false);
    expect(service.items()).toHaveLength(1);
  });
});
