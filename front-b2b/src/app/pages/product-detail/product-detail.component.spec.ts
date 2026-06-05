import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ProductResponse, ProductService, TranslationService } from '@vhandelivery/shared-ui';
import { CartService } from '../../shared/services/cart.service';
import { ProductDetailComponent } from './product-detail.component';

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
  description: { vi: 'Món demo' },
  price: { s: 1, e: 4, d: [50000] },
  currency: 'VND',
  sku: 'PHO-1',
  stock: 5,
  isActive: true,
  metadata: { category: 'Food' },
  createdAt: new Date().toISOString(),
};

describe('ProductDetailComponent', () => {
  let fixture: ComponentFixture<ProductDetailComponent>;
  let cart: CartService;
  const productService = {
    findOne: vi.fn(() => of(product)),
  };
  const translationService = {
    getLocalizedValue: vi.fn((value) => value?.vi ?? value?.en ?? ''),
  };

  beforeEach(async () => {
    localStorage.clear();
    productService.findOne.mockClear();
    translationService.getLocalizedValue.mockClear();

    await TestBed.configureTestingModule({
      imports: [ProductDetailComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ id: 'product-1' }),
            },
          },
        },
        { provide: ProductService, useValue: productService },
        { provide: TranslationService, useValue: translationService },
      ],
    }).compileComponents();

    cart = TestBed.inject(CartService);
    fixture = TestBed.createComponent(ProductDetailComponent);
    fixture.detectChanges();
  });

  it('loads product detail and adds it to cart', () => {
    expect(productService.findOne).toHaveBeenCalledWith('product-1');
    expect(fixture.nativeElement.textContent).toContain('Phở demo');
    expect(fixture.nativeElement.textContent).toContain('50.000');

    fixture.nativeElement.querySelector('button').click();

    expect(cart.items()).toHaveLength(1);
    expect(cart.total()).toBe(50000);
  });
});
