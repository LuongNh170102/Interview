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
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AuthService,
  formatMoneyVN,
  OrderService,
  ProductService,
  ProductResponse,
} from '@vhandelivery/shared-ui';
import { ToastService } from '../../components/toast/toast.service';
import { CartStateService } from '../../services/cart-state.service';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly productService = inject(ProductService);
  private readonly orderService = inject(OrderService);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly cartState = inject(CartStateService);

  readonly product = signal<ProductResponse | null>(null);
  readonly isLoading = signal(true);
  readonly quantity = signal(1);
  readonly adding = signal(false);
  readonly message = signal('');
  readonly selectedImageIndex = signal(0);

  readonly isLowStock = computed(() => {
    const stock = this.product()?.stock;
    return stock != null && stock > 0 && stock <= 5;
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.productService
      .findPublicOne(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (p) => {
          this.product.set(p);
          this.selectedImageIndex.set(0);
          this.updateSeo(p);
          this.isLoading.set(false);
        },
        error: () => {
          this.message.set('Không tìm thấy sản phẩm');
          this.isLoading.set(false);
        },
      });
  }

  private updateSeo(product: ProductResponse): void {
    const name = product.name?.vi ?? 'Sản phẩm';
    this.title.setTitle(`${name} | VhanDelivery`);
    const description =
      product.description?.vi?.trim().slice(0, 160) ??
      `Mua ${name} trên VhanDelivery`;
    this.meta.updateTag({ name: 'description', content: description });
  }

  getName(): string {
    return this.product()?.name?.vi ?? 'Sản phẩm';
  }

  getPrice(): string {
    return formatMoneyVN(this.product()?.price);
  }

  getImages(): string[] {
    const product = this.product();
    if (!product?.metadata) return [];

    const images = [...(product.metadata.images ?? [])];
    const thumb = product.metadata.thumbnail;
    if (thumb && !images.includes(thumb)) {
      images.unshift(thumb);
    }
    return images.length ? images : thumb ? [thumb] : [];
  }

  getActiveImage(): string | null {
    const images = this.getImages();
    return images[this.selectedImageIndex()] ?? images[0] ?? null;
  }

  selectImage(index: number): void {
    this.selectedImageIndex.set(index);
  }

  hasRating(): boolean {
    return (this.product()?.averageRating ?? 0) > 0;
  }

  hasReviews(): boolean {
    return (this.product()?.totalReviews ?? 0) > 0;
  }

  hasProductMeta(): boolean {
    return this.hasRating() || this.hasReviews() || !!this.getStockLabel();
  }

  getRatingLabel(): string {
    return (this.product()?.averageRating ?? 0).toFixed(1);
  }

  getReviewLabel(): string {
    const count = this.product()?.totalReviews ?? 0;
    return `${count.toLocaleString('vi-VN')} đánh giá`;
  }

  getStockLabel(): string {
    const stock = this.product()?.stock;
    if (stock == null) return '';
    if (stock <= 0) return 'Hết hàng';
    return `Còn ${stock.toLocaleString('vi-VN')} sản phẩm`;
  }

  getDescriptionLines(): string[] {
    const text = this.product()?.description?.vi?.trim();
    if (!text) return [];

    return text
      .split(/\n+/)
      .map((line) => line.replace(/^[-•*]\s*/, '').trim())
      .filter(Boolean);
  }

  getMerchantLocation(): string {
    const merchant = this.product()?.merchant;
    if (!merchant) return '';
    return [merchant.city, merchant.address].filter(Boolean).join(', ');
  }

  changeQty(delta: number): void {
    const stock = this.product()?.stock;
    const next = this.quantity() + delta;
    if (next < 1) return;
    if (stock != null && next > stock) return;
    this.quantity.set(next);
  }

  addToCart(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: this.router.url },
      });
      return;
    }

    const product = this.product();
    if (!product?.merchant?.externalId) return;

    this.adding.set(true);
    this.cartState.setMerchantId(product.merchant.externalId);

    this.orderService
      .addCartItem({
        productId: product.externalId,
        merchantId: product.merchant.externalId,
        quantity: this.quantity(),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.adding.set(false);
          this.toastService.success('Đã thêm vào giỏ hàng');
        },
        error: () => {
          this.adding.set(false);
          this.toastService.error('Thêm giỏ hàng thất bại');
        },
      });
  }
}
