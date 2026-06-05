import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  HostListener,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import {
  coerceNumericValue,
  ProductResponse,
  ProductService,
  TranslatePipe,
  TranslationService,
} from '@vhandelivery/shared-ui';
import { CartStore } from '../../cart.store';

@Component({
  standalone: true,
  selector: 'app-catalog',
  imports: [CommonModule, RouterLink, TranslatePipe],
  template: `
    <section class="hero-card">
      <div class="hero-copy-block">
        <p class="eyebrow">{{ 'b2c.catalog.eyebrow' | translate }}</p>
        <h1>{{ 'b2c.catalog.title' | translate }}</h1>
        <p class="hero-copy">
          {{ 'b2c.catalog.description' | translate }}
        </p>
      </div>
      <div class="hero-stats">
        <div class="stat-card">
          <strong>{{ totalProducts() || products().length }}</strong>
          <span>{{ 'b2c.catalog.stats.liveProducts' | translate }}</span>
        </div>
        <div class="stat-card">
          <strong>{{ liveMerchantCount() }}</strong>
          <span>{{ 'b2c.catalog.stats.approvedStores' | translate }}</span>
        </div>
        <div class="stat-card">
          <strong>{{ cartStore.totalItems() }}</strong>
          <span>{{ 'b2c.catalog.stats.itemsInCart' | translate }}</span>
        </div>
      </div>
    </section>

    @if (loadError()) {
    <section class="state-card error">{{ loadError() }}</section>
    } @if (isLoading()) {
    <section class="product-grid skeleton-grid">
      @for (card of skeletonCards; track card) {
      <article class="product-card skeleton-card">
        <div class="product-thumb"></div>
        <div class="product-body">
          <div class="skeleton-line short"></div>
          <div class="skeleton-line"></div>
          <div class="skeleton-line muted"></div>
        </div>
        <div class="product-footer">
          <div class="skeleton-block"></div>
          <div class="skeleton-button"></div>
        </div>
      </article>
      }
    </section>
    } @else if (products().length === 0) {
    <section class="state-card empty-state">
      <h2>{{ 'b2c.catalog.emptyTitle' | translate }}</h2>
      <p>
        {{ 'b2c.catalog.emptyDescription' | translate }}
      </p>
    </section>
    } @else {
    <section class="product-grid">
      @for (product of products(); track product.externalId) {
      <article class="product-card">
        <a
          [routerLink]="['/products', product.externalId]"
          class="product-link"
        >
          <div class="product-thumb">
            <span class="status-chip">{{ statusLabel(product) }}</span>
            @if (cardImage(product); as imageUrl) {
            <img
              [src]="imageUrl"
              [alt]="readLocalized(product.name)"
              (error)="markThumbnailBroken(product.externalId)"
            />
            } @else {
            <div class="thumb-fallback">
              {{ readLocalized(product.name).charAt(0) }}
            </div>
            }
          </div>

          <div class="product-body">
            <div class="product-meta-row">
              <p class="merchant-name">{{ product.merchant?.name }}</p>
              <span class="category-chip">{{ categoryLabel(product) }}</span>
            </div>
            <h2>{{ readLocalized(product.name) }}</h2>
            <p class="description">
              {{
                readLocalized(product.description) ||
                  ('b2c.catalog.fallbackDescription' | translate)
              }}
            </p>
          </div>
        </a>

        <div class="product-footer">
          <div>
            <strong>{{ priceLabel(product) }}</strong>
            <span>{{ stockLabel(product) }}</span>
          </div>
          <button
            type="button"
            (click)="addToCart(product)"
            [disabled]="(product.stock ?? 0) < 1"
          >
            {{ 'b2c.catalog.actions.addToCart' | translate }}
          </button>
        </div>
      </article>
      }
    </section>

    @if (isLoadingMore()) {
    <section class="product-grid load-more-grid skeleton-grid">
      @for (card of loadMoreCards; track card) {
      <article class="product-card skeleton-card">
        <div class="product-thumb"></div>
        <div class="product-body">
          <div class="skeleton-line short"></div>
          <div class="skeleton-line"></div>
          <div class="skeleton-line muted"></div>
        </div>
        <div class="product-footer">
          <div class="skeleton-block"></div>
          <div class="skeleton-button"></div>
        </div>
      </article>
      }
    </section>
    } }
  `,
  styles: [
    `
      .hero-card,
      .state-card {
        border-radius: 24px;
        border: 1px solid rgba(42, 34, 20, 0.08);
        background: rgba(255, 255, 255, 0.84);
        padding: 1.75rem;
        box-shadow: 0 24px 60px rgba(76, 46, 20, 0.08);
      }
      .hero-card {
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        gap: 1.5rem;
        margin-bottom: 1.5rem;
        background: linear-gradient(
          135deg,
          rgba(255, 251, 245, 0.96),
          rgba(255, 240, 223, 0.88)
        );
      }
      .eyebrow {
        margin: 0 0 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #c2561a;
        font-size: 0.8rem;
        font-weight: 700;
      }
      h1 {
        margin: 0;
        font-size: clamp(2rem, 5vw, 3.5rem);
        line-height: 1;
      }
      .hero-copy {
        margin: 1rem 0 0;
        max-width: 62rem;
        color: #5b4f42;
        line-height: 1.7;
      }
      .hero-stats {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 0.9rem;
      }
      .stat-card {
        display: flex;
        flex-direction: column;
        justify-content: center;
        min-height: 96px;
        padding: 1rem 1.1rem;
        border-radius: 20px;
        background: rgba(255, 255, 255, 0.9);
        border: 1px solid rgba(42, 34, 20, 0.08);
      }
      .hero-stats strong {
        font-size: 1.8rem;
      }
      .hero-stats span {
        color: #7f6b57;
        margin-top: 0.25rem;
      }
      button {
        border: 0;
        border-radius: 999px;
        padding: 0.85rem 1.2rem;
        cursor: pointer;
        transition: transform 150ms ease, box-shadow 150ms ease,
          background 150ms ease;
      }
      button:hover {
        transform: translateY(-1px);
      }
      button {
        background: #c2561a;
        color: white;
        box-shadow: 0 14px 28px rgba(194, 86, 26, 0.2);
      }
      .product-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 1rem;
      }
      .load-more-grid {
        margin-top: 1rem;
      }
      .skeleton-card {
        overflow: hidden;
      }
      .skeleton-card .product-thumb,
      .skeleton-line,
      .skeleton-block,
      .skeleton-button {
        background: linear-gradient(
          90deg,
          rgba(255, 225, 191, 0.75),
          rgba(255, 244, 230, 0.95),
          rgba(255, 225, 191, 0.75)
        );
        background-size: 200% 100%;
        animation: shimmer 1.4s linear infinite;
      }
      .skeleton-line {
        height: 0.95rem;
        border-radius: 999px;
        margin-bottom: 0.75rem;
      }
      .skeleton-line.short {
        width: 45%;
      }
      .skeleton-line.muted {
        width: 72%;
      }
      .skeleton-block {
        width: 45%;
        height: 2.2rem;
        border-radius: 16px;
      }
      .skeleton-button {
        width: 7.5rem;
        height: 2.8rem;
        border-radius: 999px;
      }
      .empty-state h2 {
        margin: 0 0 0.5rem;
        font-size: 1.25rem;
      }
      .empty-state p {
        margin: 0;
        max-width: 42rem;
        color: #5b4f42;
        line-height: 1.6;
      }
      .product-card {
        display: flex;
        flex-direction: column;
        overflow: hidden;
        border-radius: 24px;
        border: 1px solid rgba(42, 34, 20, 0.08);
        background: rgba(255, 255, 255, 0.86);
        box-shadow: 0 20px 50px rgba(76, 46, 20, 0.08);
        transition: transform 160ms ease, box-shadow 160ms ease;
      }
      .product-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 24px 56px rgba(76, 46, 20, 0.12);
      }
      .product-link {
        color: inherit;
        text-decoration: none;
      }
      .product-thumb {
        position: relative;
        aspect-ratio: 4 / 3;
        background: linear-gradient(135deg, #ffe1bf, #fff6ea);
      }
      .product-thumb img,
      .thumb-fallback {
        width: 100%;
        height: 100%;
      }
      .product-thumb img {
        object-fit: cover;
      }
      .thumb-fallback {
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2rem;
        font-weight: 800;
        color: #c2561a;
      }
      .status-chip,
      .category-chip {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 999px;
        padding: 0.35rem 0.65rem;
        font-size: 0.72rem;
        font-weight: 700;
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }
      .status-chip {
        position: absolute;
        top: 0.85rem;
        left: 0.85rem;
        background: rgba(32, 22, 13, 0.72);
        color: white;
      }
      .product-meta-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
      }
      .category-chip {
        background: #fff4e6;
        color: #8a5a28;
      }
      .product-body {
        padding: 1rem 1rem 0.5rem;
      }
      .merchant-name {
        margin: 0 0 0.35rem;
        color: #8a775f;
        font-size: 0.85rem;
      }
      h2 {
        margin: 0;
        font-size: 1.15rem;
      }
      .description {
        margin: 0.5rem 0 0;
        color: #5b4f42;
        line-height: 1.5;
      }
      .product-footer {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 1rem;
        padding: 1rem;
      }
      .product-footer div {
        display: flex;
        flex-direction: column;
      }
      .product-footer span {
        color: #8a775f;
        font-size: 0.85rem;
      }
      button[disabled] {
        cursor: not-allowed;
        opacity: 0.6;
        box-shadow: none;
      }
      .error {
        color: #9f1c1c;
      }
      @keyframes shimmer {
        0% {
          background-position: 200% 0;
        }
        100% {
          background-position: -200% 0;
        }
      }
      @media (max-width: 768px) {
        .hero-stats {
          grid-template-columns: 1fr;
        }
        .product-footer {
          flex-direction: column;
          align-items: stretch;
        }
        .product-meta-row {
          align-items: flex-start;
          flex-direction: column;
        }
      }
    `,
  ],
})
export class CatalogComponent implements OnInit {
  private readonly productService = inject(ProductService);
  readonly cartStore = inject(CartStore);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly translationService = inject(TranslationService);
  private readonly pageSize = 10;
  private nextPage = 1;

  readonly isLoading = signal(true);
  readonly isLoadingMore = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly products = signal<ProductResponse[]>([]);
  readonly totalProducts = signal(0);
  readonly skeletonCards = Array.from(
    { length: this.pageSize },
    (_, index) => index
  );
  readonly loadMoreCards = Array.from({ length: 3 }, (_, index) => index);
  readonly brokenThumbnails = signal<Record<string, true>>({});
  readonly hasMoreProducts = computed(
    () => this.products().length < this.totalProducts()
  );
  readonly liveMerchantCount = computed(() => {
    return new Set(
      this.products()
        .map((product) => product.merchant?.externalId)
        .filter((merchantId): merchantId is string => Boolean(merchantId))
    ).size;
  });

  ngOnInit(): void {
    this.title.setTitle(this.t('b2c.catalog.meta.title'));
    this.meta.updateTag({
      name: 'description',
      content: this.t('b2c.catalog.meta.description'),
    });

    this.loadProducts(1, true);
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    if (
      typeof window === 'undefined' ||
      this.isLoading() ||
      this.isLoadingMore() ||
      !this.hasMoreProducts()
    ) {
      return;
    }

    const scrollBottom = window.innerHeight + window.scrollY;
    const viewportHeight =
      document.documentElement.scrollHeight || document.body.scrollHeight;

    if (scrollBottom >= viewportHeight - 320) {
      this.loadNextPage();
    }
  }

  private loadProducts(page: number, replace = false): void {
    if (replace) {
      this.isLoading.set(true);
      this.loadError.set(null);
      this.totalProducts.set(0);
      this.nextPage = 1;
    } else {
      this.isLoadingMore.set(true);
    }

    this.productService.findAll({ page, limit: this.pageSize }).subscribe({
      next: (response) => {
        this.totalProducts.set(response.total);
        this.products.set(
          replace ? response.data : [...this.products(), ...response.data]
        );
        this.nextPage = response.page + 1;
        this.isLoading.set(false);
        this.isLoadingMore.set(false);
      },
      error: () => {
        if (replace) {
          this.loadError.set(this.t('b2c.catalog.loadError'));
        }

        this.isLoading.set(false);
        this.isLoadingMore.set(false);
      },
    });
  }

  private loadNextPage(): void {
    if (this.isLoading() || this.isLoadingMore() || !this.hasMoreProducts()) {
      return;
    }

    this.loadProducts(this.nextPage);
  }

  addToCart(product: ProductResponse): void {
    this.cartStore.addProduct(product, 1);
  }

  markThumbnailBroken(productId: string): void {
    this.brokenThumbnails.update((current) => ({
      ...current,
      [productId]: true,
    }));
  }

  isThumbnailBroken(productId: string): boolean {
    return Boolean(this.brokenThumbnails()[productId]);
  }

  cardImage(product: ProductResponse): string | null {
    if (this.isThumbnailBroken(product.externalId)) {
      return null;
    }

    return product.images[0] ?? product.thumbnail ?? null;
  }

  readLocalized(
    value: ProductResponse['name'] | ProductResponse['description']
  ): string {
    return this.translationService.getLocalizedValue(value, 'vi');
  }

  priceLabel(product: ProductResponse): string {
    return `${(coerceNumericValue(product.price) ?? 0).toLocaleString(
      'vi-VN'
    )} ${product.currency ?? 'VND'}`;
  }

  stockLabel(product: ProductResponse): string {
    return (product.stock ?? 0) > 0
      ? `${product.stock ?? 0} ${this.t('b2c.catalog.stock.in')}`
      : this.t('b2c.catalog.stock.out');
  }

  categoryLabel(product: ProductResponse): string {
    const category = product.category?.name;
    if (!category) {
      return this.t('b2c.catalog.categoryGeneral');
    }

    return (
      this.translationService.getLocalizedValue(category, 'vi') ||
      this.t('b2c.catalog.categoryGeneral')
    );
  }

  statusLabel(product: ProductResponse): string {
    if (product.isActive === false) {
      return this.t('b2c.catalog.status.inactive');
    }

    switch (product.status) {
      case 'ARCHIVED':
        return this.t('b2c.catalog.status.archived');
      case 'DRAFT':
        return this.t('b2c.catalog.status.draft');
      default:
        return this.t('b2c.catalog.status.published');
    }
  }

  private t(key: string): string {
    return this.translationService.translate(key);
  }
}
