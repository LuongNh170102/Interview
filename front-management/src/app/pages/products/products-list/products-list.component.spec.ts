import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { ProductsListComponent } from './products-list.component';
import {
  AuthService,
  CategoryService,
  MerchantService,
  ProductService,
  TranslationService,
} from '@vhandelivery/shared-ui';
import { GlobalModalService } from '../../../shared/components/global-modal/global-modal.service';

describe('ProductsListComponent', () => {
  const mockProduct = {
    externalId: 'prod-1',
    id: 1,
    merchantId: 1,
    name: { vi: 'Áo thun', en: 'T-shirt' },
    sku: 'SKU-001',
    price: 150000,
    stock: 10,
    publishStatus: 'PUBLISHED' as const,
    isActive: true,
    createdAt: '2026-06-05T00:00:00.000Z',
  };

  const productService = {
    findByMerchant: vi.fn(() =>
      of({
        data: [mockProduct],
        meta: { total: 1, page: 1, lastPage: 1, limit: 10 },
      })
    ),
    findOne: vi.fn(() => of(mockProduct)),
    create: vi.fn(() => of(mockProduct)),
    update: vi.fn(() => of(mockProduct)),
    delete: vi.fn(() => of(mockProduct)),
  };

  const merchantService = {
    findAll: vi.fn(() =>
      of({
        data: [{ externalId: 'merchant-1', name: 'Demo Store' }],
      })
    ),
    findMine: vi.fn(() => of([{ externalId: 'merchant-1', name: 'Demo Store' }])),
  };

  const categoryService = {
    findAll: vi.fn(() => of([])),
  };

  const authService = {
    hasPermission: vi.fn(() => true),
  };

  const modalService = {
    showConfirmation: vi.fn((_title: string, _message: string, onConfirm?: () => void) => {
      onConfirm?.();
    }),
    showSuccess: vi.fn(),
    showError: vi.fn(),
  };

  const translationService = {
    translate: vi.fn((key: string) => key),
    getLanguage: vi.fn(() => 'vi' as const),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [ProductsListComponent],
      providers: [
        { provide: ProductService, useValue: productService },
        { provide: MerchantService, useValue: merchantService },
        { provide: CategoryService, useValue: categoryService },
        { provide: AuthService, useValue: authService },
        { provide: GlobalModalService, useValue: modalService },
        { provide: TranslationService, useValue: translationService },
      ],
    }).compileComponents();
  });

  it('should load products for selected merchant on init', () => {
    const fixture = TestBed.createComponent(ProductsListComponent);
    fixture.detectChanges();

    expect(productService.findByMerchant).toHaveBeenCalledWith(
      'merchant-1',
      expect.objectContaining({ page: 1, limit: 10 })
    );
    expect(fixture.componentInstance.products().length).toBe(1);
  });

  it('should reload products when search changes', () => {
    const fixture = TestBed.createComponent(ProductsListComponent);
    fixture.detectChanges();
    productService.findByMerchant.mockClear();

    fixture.componentInstance.onHeaderSearch({ query: 'SKU-001' });

    expect(productService.findByMerchant).toHaveBeenCalledWith(
      'merchant-1',
      expect.objectContaining({ search: 'SKU-001', page: 1 })
    );
  });

  it('should call update with images when editing', () => {
    const fixture = TestBed.createComponent(ProductsListComponent);
    fixture.detectChanges();

    fixture.componentInstance.openEditModal('prod-1');
    fixture.detectChanges();

    const file = new File(['img'], 'photo.png', { type: 'image/png' });
    const input = document.createElement('input');
    Object.defineProperty(input, 'files', { value: [file] });
    fixture.componentInstance.onImagesSelected({ target: input } as unknown as Event);
    fixture.componentInstance.productForm.patchValue({
      nameVi: 'Áo thun mới',
      sku: 'SKU-001',
      price: 160000,
      stock: 8,
      publishStatus: 'PUBLISHED',
    });
    fixture.componentInstance.submitForm();

    expect(productService.update).toHaveBeenCalledWith(
      'prod-1',
      expect.objectContaining({
        publishStatus: 'PUBLISHED',
        isActive: true,
      }),
      [file]
    );
  });

  it('should show error modal when product load fails', () => {
    productService.findByMerchant.mockReturnValueOnce(
      throwError(() => new Error('network'))
    );

    const fixture = TestBed.createComponent(ProductsListComponent);
    fixture.detectChanges();

    expect(modalService.showError).toHaveBeenCalled();
    expect(fixture.componentInstance.isLoading()).toBe(false);
  });
});
