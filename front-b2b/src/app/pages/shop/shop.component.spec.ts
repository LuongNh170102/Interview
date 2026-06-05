import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import {
  ProductListResponse,
  ProductService,
  TranslationService,
} from '@vhandelivery/shared-ui';
import { ShopComponent } from './shop.component';

const response: ProductListResponse = {
  data: [
    {
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
      stock: 5,
      isActive: true,
      createdAt: new Date().toISOString(),
    },
  ],
  meta: { total: 1, page: 1, lastPage: 1, limit: 12 },
};

describe('ShopComponent', () => {
  let fixture: ComponentFixture<ShopComponent>;
  const productService = {
    findPublic: vi.fn(() => of(response)),
  };
  const translationService = {
    getLocalizedValue: vi.fn((value) => value?.vi ?? value?.en ?? ''),
  };

  beforeEach(async () => {
    productService.findPublic.mockClear();
    translationService.getLocalizedValue.mockClear();

    await TestBed.configureTestingModule({
      imports: [ShopComponent],
      providers: [
        provideRouter([]),
        { provide: ProductService, useValue: productService },
        { provide: TranslationService, useValue: translationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ShopComponent);
    fixture.detectChanges();
  });

  it('loads public products on init', () => {
    expect(productService.findPublic).toHaveBeenCalledWith({
      page: 1,
      limit: 12,
    });
    expect(fixture.nativeElement.textContent).toContain('Phở demo');
    expect(fixture.nativeElement.textContent).toContain('50.000');
  });
});
