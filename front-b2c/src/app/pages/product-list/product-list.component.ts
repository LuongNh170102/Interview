import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { debounceTime, Subject } from 'rxjs';
import {
  formatMoneyVN,
  ProductResponse,
  ProductService,
  PublicProductFilterCategory,
  PublicProductFilterMerchant,
  PublicProductSort,
  SelectOption,
} from '@vhandelivery/shared-ui';
import { CustomDropdownComponent } from '../../components/custom-dropdown/custom-dropdown.component';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, CustomDropdownComponent],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductListComponent implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly search$ = new Subject<string>();
  private readonly priceSlider$ = new Subject<void>();

  readonly isLoading = signal(true);
  readonly filtersReady = signal(false);
  readonly isPriceFilterLoading = signal(false);
  readonly error = signal('');
  readonly showMobileFilters = signal(false);

  readonly products = signal<ProductResponse[]>([]);
  readonly total = signal(0);
  readonly merchants = signal<PublicProductFilterMerchant[]>([]);
  readonly categoryOptions = signal<PublicProductFilterCategory[]>([]);

  readonly searchQuery = signal('');
  readonly selectedCategoryIds = signal<Set<string>>(new Set());
  readonly selectedMerchantIds = signal<Set<string>>(new Set());
  readonly priceMin = signal(0);
  readonly priceMax = signal(0);
  readonly priceCeiling = signal(100000);

  readonly sortBy = signal<PublicProductSort>('newest');
  readonly page = signal(1);
  readonly pageSize = signal(12);

  readonly sortOptions: SelectOption[] = [
    { value: 'newest', label: 'Mới nhất' },
    { value: 'price-asc', label: 'Giá thấp → cao' },
    { value: 'price-desc', label: 'Giá cao → thấp' },
    { value: 'rating', label: 'Đánh giá cao' },
  ];

  readonly pageSizeSelectOptions: SelectOption[] = [
    { value: '8', label: '8' },
    { value: '12', label: '12' },
    { value: '24', label: '24' },
  ];

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.total() / this.pageSize()))
  );

  readonly skeletonProductItems = computed(() =>
    Array.from({ length: this.pageSize() }, (_, index) => index + 1)
  );

  readonly pageNumbers = computed(() => {
    const total = this.totalPages();
    const current = this.page();
    const pages: number[] = [];
    const start = Math.max(1, current - 2);
    const end = Math.min(total, start + 4);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  });

  ngOnInit(): void {
    this.title.setTitle('Sản phẩm | VhanDelivery');
    this.meta.updateTag({
      name: 'description',
      content: 'Khám phá sản phẩm từ các cửa hàng đối tác trên VhanDelivery',
    });

    this.productService
      .findPublicFilters()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (filters) => {
          this.merchants.set(filters.merchants);
          this.categoryOptions.set(filters.categories);
          this.priceCeiling.set(filters.priceRange.max);
          this.priceMax.set(filters.priceRange.max);
          this.filtersReady.set(true);
        },
        error: () => {
          this.filtersReady.set(true);
        },
      });

    this.search$
      .pipe(debounceTime(300), takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        this.searchQuery.set(value);
        this.resetPageAndFetch();
      });

    this.priceSlider$
      .pipe(debounceTime(500), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.page.set(1);
        this.fetchProducts();
      });

    this.fetchProducts();
  }

  getName(product: ProductResponse): string {
    return product.name?.vi ?? 'Sản phẩm';
  }

  getCategoryName(category: PublicProductFilterCategory): string {
    return category.name?.vi ?? category.id;
  }

  getPrice(product: ProductResponse): string {
    return formatMoneyVN(product.price);
  }

  getThumbnail(product: ProductResponse): string | null {
    return product.metadata?.thumbnail ?? product.metadata?.images?.[0] ?? null;
  }

  getRating(product: ProductResponse): string {
    const rating = product.averageRating ?? 0;
    return rating > 0 ? rating.toFixed(1) : '—';
  }

  toggleCategory(categoryId: string, checked: boolean): void {
    this.selectedCategoryIds.update((set) => {
      const next = new Set(set);
      if (checked) next.add(categoryId);
      else next.delete(categoryId);
      return next;
    });
    this.resetPageAndFetch();
  }

  toggleMerchant(merchantId: string, checked: boolean): void {
    this.selectedMerchantIds.update((set) => {
      const next = new Set(set);
      if (checked) next.add(merchantId);
      else next.delete(merchantId);
      return next;
    });
    this.resetPageAndFetch();
  }

  isCategorySelected(categoryId: string): boolean {
    return this.selectedCategoryIds().has(categoryId);
  }

  isMerchantSelected(merchantId: string): boolean {
    return this.selectedMerchantIds().has(merchantId);
  }

  onSearchInput(value: string): void {
    this.search$.next(value);
  }

  onSortChange(value: string): void {
    this.sortBy.set(value as PublicProductSort);
    this.resetPageAndFetch();
  }

  onPriceMinChange(value: number): void {
    const min = Math.max(0, Math.min(value, this.priceMax()));
    this.priceMin.set(min);
    this.resetPageAndFetch();
  }

  onPriceMaxChange(value: number): void {
    const max = Math.min(
      this.priceCeiling(),
      Math.max(value, this.priceMin())
    );
    this.priceMax.set(max);
    this.resetPageAndFetch();
  }

  onPriceSliderInput(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.priceMax.set(value);
  }

  onPriceSliderCommit(): void {
    this.isPriceFilterLoading.set(true);
    this.priceSlider$.next();
  }

  clearFilters(): void {
    this.selectedCategoryIds.set(new Set());
    this.selectedMerchantIds.set(new Set());
    this.searchQuery.set('');
    this.priceMin.set(0);
    this.priceMax.set(this.priceCeiling());
    this.sortBy.set('newest');
    this.resetPageAndFetch();
  }

  changePageSize(size: number): void {
    this.pageSize.set(size);
    this.resetPageAndFetch();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.page.set(page);
    this.fetchProducts();
  }

  toggleMobileFilters(): void {
    this.showMobileFilters.update((v) => !v);
  }

  private resetPageAndFetch(): void {
    this.page.set(1);
    this.fetchProducts();
  }

  private fetchProducts(): void {
    this.isLoading.set(true);
    this.productService
      .findPublic(this.buildQueryParams())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.products.set(res.data);
          this.total.set(res.meta.total);
          this.isLoading.set(false);
          this.isPriceFilterLoading.set(false);
          this.error.set('');
        },
        error: () => {
          this.error.set('Không thể tải sản phẩm');
          this.isLoading.set(false);
          this.isPriceFilterLoading.set(false);
        },
      });
  }

  private buildQueryParams() {
    const categoryIds = [...this.selectedCategoryIds()];
    const merchantIds = [...this.selectedMerchantIds()];

    return {
      page: this.page(),
      limit: this.pageSize(),
      search: this.searchQuery().trim() || undefined,
      categoryIds: categoryIds.length ? categoryIds.join(',') : undefined,
      merchantIds: merchantIds.length ? merchantIds.join(',') : undefined,
      minPrice: this.priceMin() > 0 ? this.priceMin() : undefined,
      maxPrice:
        this.priceMax() > 0 && this.priceMax() < this.priceCeiling()
          ? this.priceMax()
          : undefined,
      sortBy: this.sortBy(),
    };
  }
}
