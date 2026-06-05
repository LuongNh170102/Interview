import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import {
  MerchantService,
  MyMerchantResponse,
  ProductService,
} from '@vhandelivery/shared-ui';
import { GlobalModalService } from '../../../shared/components/global-modal/global-modal.service';
import { ProductListComponent } from './product-list.component';

describe('ProductListComponent', () => {
  let fixture: ComponentFixture<ProductListComponent>;
  let component: ProductListComponent;

  const merchant: MyMerchantResponse = {
    id: 1,
    externalId: 'merchant-external-id',
    name: 'Store A',
    approvalStatus: 'APPROVED',
    operationalStatus: 'ACTIVE',
    isAcceptingOrders: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  const product = {
    id: 10,
    externalId: 'product-external-id',
    merchantId: 1,
    name: { vi: 'Product A' },
    description: { vi: 'Good product' },
    price: { s: 1, e: 4, d: [12000] },
    currency: 'VND',
    sku: 'SKU-1',
    stock: 5,
    isActive: true,
    metadata: {},
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  const merchantServiceMock = {
    findMine: vi.fn().mockReturnValue(of({ data: [merchant] })),
  };

  const productServiceMock = {
    findByMerchant: vi.fn().mockReturnValue(
      of({
        data: [product],
        meta: {
          total: 1,
          page: 1,
          lastPage: 1,
          limit: 10,
        },
      })
    ),
    create: vi.fn().mockReturnValue(of(product)),
    update: vi.fn().mockReturnValue(of(product)),
    delete: vi.fn().mockReturnValue(of(product)),
  };

  const modalServiceMock = {
    showSuccess: vi.fn(),
    showError: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [ProductListComponent],
      providers: [
        { provide: MerchantService, useValue: merchantServiceMock },
        { provide: ProductService, useValue: productServiceMock },
        { provide: GlobalModalService, useValue: modalServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads managed merchants and products on init', () => {
    expect(merchantServiceMock.findMine).toHaveBeenCalled();
    expect(component.selectedMerchantId()).toBe(merchant.externalId);
    expect(productServiceMock.findByMerchant).toHaveBeenCalledWith(
      merchant.externalId,
      { page: 1, limit: 10 }
    );
    expect(component.products()).toEqual([product]);
    expect(fixture.nativeElement.textContent).toContain('12.000');
  });

  it('creates product with form data for selected merchant', () => {
    component.openCreateForm();
    component.form.set({
      name: 'New product',
      description: 'Description',
      price: 15000,
      sku: 'SKU-2',
      stock: 3,
      category: 'Food',
      isActive: true,
      images: [],
    });

    component.submitForm();

    expect(productServiceMock.create).toHaveBeenCalledWith(
      merchant.externalId,
      expect.any(FormData)
    );
    expect(modalServiceMock.showSuccess).toHaveBeenCalled();
  });
});
