import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
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
  selector: 'app-product-detail',
  imports: [CommonModule, RouterLink, TranslatePipe],
  template: `
    @if (isLoading()) {
    <section class="detail-shell">
      <div class="gallery-card skeleton-panel"></div>
      <article class="detail-card skeleton-copy">
        <div class="skeleton-line short"></div>
        <div class="skeleton-line"></div>
        <div class="skeleton-line muted"></div>
        <div class="skeleton-button"></div>
      </article>
    </section>
    } @else if (loadError()) {
    <section class="detail-shell state-card error">{{ loadError() }}</section>
    } @else if (product(); as item) {
    <section class="detail-shell">
      <div class="gallery-card">
        <div class="hero-image">
          @if (activeImage() && !isImageBroken(activeImage())) {
          <img
            [src]="activeImage()"
            [alt]="readLocalized(item.name)"
            (error)="markImageBroken(activeImage(), item)"
          />
          } @else {
          <div class="hero-fallback">
            {{ readLocalized(item.name).charAt(0) }}
          </div>
          }
        </div>

        @if (allImages(item).length > 1) {
        <div class="thumb-row">
          @for (image of allImages(item); track image) {
          <button
            type="button"
            class="thumb-button"
            (click)="activeImage.set(image)"
          >
            @if (!isImageBroken(image)) {
            <img
              [src]="image"
              [attr.alt]="'b2c.detail.labels.previewThumbnail' | translate"
              (error)="markImageBroken(image, item)"
            />
            } @else {
            <div class="thumb-fallback-mini"></div>
            }
          </button>
          }
        </div>
        }
      </div>

      <article class="detail-card">
        <a routerLink="/" class="back-link">{{
          'b2c.detail.backToProducts' | translate
        }}</a>
        <p class="merchant-name">{{ item.merchant?.name }}</p>
        <h1>{{ readLocalized(item.name) }}</h1>
        <p class="price">{{ priceLabel(item) }}</p>
        <p class="description">{{ readLocalized(item.description) }}</p>

        <div class="detail-meta">
          <span
            >{{ 'b2c.detail.labels.status' | translate }}:
            {{ statusLabel(item) }}</span
          >
          <span
            >{{ 'b2c.detail.labels.stock' | translate }}:
            {{ item.stock ?? 0 }}</span
          >
        </div>

        <div class="quantity-row">
          <button type="button" (click)="decreaseQuantity()">-</button>
          <span>{{ quantity() }}</span>
          <button type="button" (click)="increaseQuantity(item.stock ?? 0)">
            +
          </button>
        </div>

        @if (cartNotice()) {
        <p class="cart-notice">{{ cartNotice() }}</p>
        }

        <div class="action-row">
          <button type="button" class="primary" (click)="addToCart(item)">
            {{ 'b2c.detail.actions.addToCart' | translate }}
          </button>
          <a routerLink="/cart" class="secondary">{{
            'b2c.detail.actions.viewCart' | translate
          }}</a>
        </div>
      </article>
    </section>
    }
  `,
  styles: [
    `
      .detail-shell {
        display: grid;
        grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
        gap: 1.5rem;
      }
      .gallery-card,
      .detail-card,
      .state-card {
        border-radius: 28px;
        border: 1px solid rgba(42, 34, 20, 0.08);
        background: rgba(255, 255, 255, 0.88);
        padding: 1.5rem;
        box-shadow: 0 24px 60px rgba(76, 46, 20, 0.08);
      }
      .hero-image {
        aspect-ratio: 1 / 1;
        overflow: hidden;
        border-radius: 20px;
        background: linear-gradient(135deg, #ffe1bf, #fff6ea);
      }
      .skeleton-panel,
      .skeleton-line,
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
      .skeleton-panel {
        min-height: 520px;
      }
      .skeleton-copy {
        display: grid;
        align-content: start;
        gap: 0.85rem;
      }
      .skeleton-line {
        height: 1rem;
        border-radius: 999px;
      }
      .skeleton-line.short {
        width: 28%;
      }
      .skeleton-line.muted {
        width: 72%;
      }
      .skeleton-button {
        width: 10rem;
        height: 3rem;
        border-radius: 999px;
        margin-top: 0.5rem;
      }
      .hero-image img,
      .hero-fallback {
        width: 100%;
        height: 100%;
      }
      .hero-image img {
        object-fit: cover;
      }
      .hero-fallback {
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 4rem;
        color: #c2561a;
        font-weight: 800;
      }
      .thumb-row {
        display: flex;
        gap: 0.75rem;
        margin-top: 1rem;
      }
      .thumb-button {
        border: 0;
        padding: 0;
        width: 72px;
        height: 72px;
        border-radius: 16px;
        overflow: hidden;
        cursor: pointer;
      }
      .thumb-button img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .thumb-fallback-mini {
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #ffe1bf, #fff6ea);
      }
      .back-link {
        color: #8a775f;
        text-decoration: none;
      }
      .merchant-name {
        margin: 1rem 0 0.5rem;
        color: #c2561a;
        font-size: 0.85rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }
      h1 {
        margin: 0;
        font-size: clamp(2rem, 4vw, 3rem);
      }
      .price {
        margin: 1rem 0;
        font-size: 1.4rem;
        font-weight: 700;
      }
      .description {
        color: #5b4f42;
        line-height: 1.7;
      }
      .detail-meta {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
        color: #8a775f;
        margin: 1rem 0;
      }
      .quantity-row {
        display: inline-flex;
        align-items: center;
        gap: 1rem;
        padding: 0.35rem;
        border-radius: 999px;
        background: #fff4e6;
      }
      .quantity-row button,
      .primary,
      .secondary {
        border: 0;
        border-radius: 999px;
        cursor: pointer;
      }
      .quantity-row button {
        width: 2rem;
        height: 2rem;
        background: white;
      }
      .action-row {
        display: flex;
        gap: 0.75rem;
        margin-top: 1.5rem;
      }
      .primary,
      .secondary {
        padding: 0.9rem 1.2rem;
        text-decoration: none;
      }
      .primary {
        background: #c2561a;
        color: white;
      }
      .secondary {
        background: #fff4e6;
        color: #20160d;
      }
      .cart-notice {
        margin-top: 1rem;
        color: #9f1c1c;
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
      @media (max-width: 900px) {
        .detail-shell {
          grid-template-columns: 1fr;
        }
        .action-row {
          flex-direction: column;
        }
      }
    `,
  ],
})
export class ProductDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly productService = inject(ProductService);
  private readonly cartStore = inject(CartStore);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly translationService = inject(TranslationService);

  readonly isLoading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly product = signal<ProductResponse | null>(null);
  readonly quantity = signal(1);
  readonly activeImage = signal<string | null>(null);
  readonly cartNotice = signal<string | null>(null);
  readonly brokenImages = signal<Record<string, true>>({});

  ngOnInit(): void {
    this.title.setTitle(this.t('b2c.detail.meta.title'));
    this.meta.updateTag({
      name: 'description',
      content: this.t('b2c.detail.meta.description'),
    });

    const externalId = this.route.snapshot.paramMap.get('id');
    if (!externalId) {
      this.loadError.set(this.t('b2c.detail.notFound'));
      this.isLoading.set(false);
      return;
    }

    this.productService.findByExternalId(externalId).subscribe({
      next: (product) => {
        this.product.set(product);
        this.activeImage.set(this.allImages(product)[0] ?? null);
        this.title.setTitle(
          `${this.t('b2c.shell.brand')} | ${this.readLocalized(product.name)}`
        );
        this.meta.updateTag({
          name: 'description',
          content:
            this.readLocalized(product.description) ||
            this.t('b2c.detail.meta.productDescriptionFallback'),
        });
        this.isLoading.set(false);
      },
      error: () => {
        this.loadError.set(this.t('b2c.detail.loadError'));
        this.isLoading.set(false);
      },
    });
  }

  allImages(product: ProductResponse): string[] {
    const images = product.images.length > 0 ? product.images : [];
    if (product.thumbnail && !images.includes(product.thumbnail)) {
      return [...images, product.thumbnail];
    }
    return images;
  }

  markImageBroken(image: string | null, product: ProductResponse): void {
    if (!image) {
      return;
    }

    this.brokenImages.update((current) => ({
      ...current,
      [image]: true,
    }));

    if (this.activeImage() === image) {
      const nextImage = this.allImages(product).find(
        (candidate) => !this.isImageBroken(candidate)
      );
      this.activeImage.set(nextImage ?? null);
    }
  }

  isImageBroken(image: string | null): boolean {
    if (!image) {
      return false;
    }

    return Boolean(this.brokenImages()[image]);
  }

  increaseQuantity(stock: number): void {
    this.quantity.update((value) => (stock > value ? value + 1 : value));
  }

  decreaseQuantity(): void {
    this.quantity.update((value) => (value > 1 ? value - 1 : value));
  }

  addToCart(product: ProductResponse): void {
    const result = this.cartStore.addProduct(product, this.quantity());
    this.cartNotice.set(
      result.replacedMerchant
        ? this.t('b2c.detail.notices.resetCart')
        : this.t('b2c.detail.notices.added')
    );
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
