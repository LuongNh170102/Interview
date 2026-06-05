import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { OrderService } from '@vhandelivery/shared-ui';
import { OrdersComponent } from './orders.component';

describe('OrdersComponent', () => {
  let fixture: ComponentFixture<OrdersComponent>;
  const orderService = {
    findAll: vi.fn(() =>
      of({
        data: [
          {
            id: 1,
            externalId: 'order-external-id',
            user: {
              id: 10,
              email: 'customer@vhandelivery.com',
              username: 'CustomerDemo',
            },
            merchant: {
              id: 20,
              externalId: 'merchant-external-id',
              name: 'VHan Demo Store',
            },
            courier: {
              id: 30,
              name: 'Courier Demo',
            },
            totalAmount: 65000,
            currency: 'VND',
            status: 'pending',
            paymentStatus: 'pending',
            createdAt: new Date('2026-06-04T10:00:00Z').toISOString(),
          },
        ],
        meta: { total: 1, page: 1, lastPage: 1, limit: 10 },
      })
    ),
  };

  beforeEach(async () => {
    orderService.findAll.mockClear();

    await TestBed.configureTestingModule({
      imports: [OrdersComponent],
      providers: [{ provide: OrderService, useValue: orderService }],
    }).compileComponents();

    fixture = TestBed.createComponent(OrdersComponent);
    fixture.detectChanges();
  });

  it('loads and renders orders', () => {
    const text = fixture.nativeElement.textContent;

    expect(orderService.findAll).toHaveBeenCalledWith({ page: 1, limit: 10 });
    expect(text).toContain('CustomerDemo');
    expect(text).toContain('VHan Demo Store');
    expect(text).toContain('pending');
  });
});
