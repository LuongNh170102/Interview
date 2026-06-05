import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { OrderService, ProductResponse } from '@vhandelivery/shared-ui';
import { CheckoutComponent } from './checkout.component';
import { CartService } from '../../shared/services/cart.service';

const product: ProductResponse = {
  id: 1,
  externalId: 'product-1',
  merchantId: 1,
  merchant: {
    id: 1,
    externalId: 'merchant-1',
    name: { vi: 'Cửa hàng demo' },
  },
  name: { vi: 'Phở demo' },
  price: { s: 1, e: 4, d: [50000] },
  currency: 'VND',
  stock: 5,
  isActive: true,
  createdAt: new Date().toISOString(),
};

describe('CheckoutComponent', () => {
  let fixture: ComponentFixture<CheckoutComponent>;
  let cart: CartService;
  const orderService = {
    create: vi.fn(() =>
      of({
        id: 1,
        totalAmount: 50000,
        status: 'pending',
        paymentStatus: 'pending',
      })
    ),
  };

  beforeEach(async () => {
    localStorage.clear();
    orderService.create.mockClear();

    await TestBed.configureTestingModule({
      imports: [CheckoutComponent],
      providers: [
        provideRouter([]),
        { provide: OrderService, useValue: orderService },
      ],
    }).compileComponents();

    cart = TestBed.inject(CartService);
    cart.addItem(product, 2);
    fixture = TestBed.createComponent(CheckoutComponent);
    fixture.detectChanges();
  });

  it('submits checkout payload from cart items', () => {
    const component = fixture.componentInstance as any;
    component.updateForm('fullName', 'Nguyen Van A');
    component.updateForm('phone', '0900000000');
    component.updateForm('addressLine', '1 Nguyen Hue');

    expect(cart.total()).toBe(100000);
    component.submit();

    expect(orderService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        merchantId: 'merchant-1',
        items: [{ productId: 'product-1', quantity: 2 }],
      })
    );
    expect(cart.total()).toBe(0);
    expect(cart.items()).toHaveLength(0);
  });
});
