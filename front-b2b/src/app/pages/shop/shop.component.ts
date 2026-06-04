import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import {
  ProductResponse,
  ProductService,
  TranslationService,
} from '@vhandelivery/shared-ui';
import { finalize } from 'rxjs';
import { CartService, parseProductPrice } from '../../shared/services/cart.service';

@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './shop.component.html',
  styleUrl: './shop.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShopComponent implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly translationService = inject(TranslationService);
  protected readonly cart = inject(CartService);

  protected readonly products = signal<ProductResponse[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly noticeMessage = signal('');
  protected readonly page = signal(1);
  protected readonly lastPage = signal(1);
  protected readonly limit = 12;

  ngOnInit(): void {
    this.loadProducts();
  }

  protected loadProducts(page = this.page()): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.noticeMessage.set('');

    this.productService
      .findPublic({ page, limit: this.limit })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (response) => {
          this.products.set(response.data);
          this.page.set(response.meta.page);
          this.lastPage.set(Math.max(1, response.meta.lastPage));
        },
        error: () => {
          this.errorMessage.set('Không tải được danh sách sản phẩm.');
        },
      });
  }

  protected addToCart(product: ProductResponse): void {
    const result = this.cart.addItem(product);
    this.noticeMessage.set(
      result.ok ? 'Đã thêm sản phẩm vào giỏ hàng.' : result.reason ?? ''
    );
  }

  protected productName(product: ProductResponse): string {
    return this.translationService.getLocalizedValue(product.name, 'vi');
  }

  protected productDescription(product: ProductResponse): string {
    return this.translationService.getLocalizedValue(product.description, 'vi');
  }

  protected merchantName(product: ProductResponse): string {
    return this.translationService.getLocalizedValue(product.merchant?.name, 'vi');
  }

  protected imageUrl(product: ProductResponse): string {
    return (
      product.metadata?.thumbnail ??
      product.metadata?.images?.[0] ??
      'https://placehold.co/480x320?text=SharkBee'
    );
  }

  protected price(product: ProductResponse): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: product.currency || 'VND',
      maximumFractionDigits: 0,
    }).format(parseProductPrice(product.price));
  }

  protected canAdd(product: ProductResponse): boolean {
    return product.isActive !== false && Number(product.stock ?? 1) > 0;
  }
}
