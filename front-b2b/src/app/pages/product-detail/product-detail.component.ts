import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import {
  ProductResponse,
  ProductService,
  TranslationService,
} from '@vhandelivery/shared-ui';
import { finalize } from 'rxjs';
import { CartService, parseProductPrice } from '../../shared/services/cart.service';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly productService = inject(ProductService);
  private readonly translationService = inject(TranslationService);
  protected readonly cart = inject(CartService);

  protected readonly product = signal<ProductResponse | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly noticeMessage = signal('');

  ngOnInit(): void {
    const productId = this.route.snapshot.paramMap.get('id');
    if (!productId) {
      this.errorMessage.set('Không tìm thấy sản phẩm.');
      return;
    }
    this.loadProduct(productId);
  }

  protected loadProduct(productId: string): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.noticeMessage.set('');

    this.productService
      .findOne(productId)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (product) => this.product.set(product),
        error: () => this.errorMessage.set('Không tải được thông tin sản phẩm.'),
      });
  }

  protected addToCart(product: ProductResponse): void {
    const result = this.cart.addItem(product);
    this.noticeMessage.set(
      result.ok ? 'Đã thêm sản phẩm vào giỏ hàng.' : result.reason ?? ''
    );
  }

  protected localizedText(
    value?: ProductResponse['name'] | ProductResponse['description']
  ): string {
    return this.translationService.getLocalizedValue(value, 'vi');
  }

  protected merchantName(product: ProductResponse): string {
    return this.translationService.getLocalizedValue(product.merchant?.name, 'vi');
  }

  protected imageUrl(product: ProductResponse): string {
    return (
      product.metadata?.thumbnail ??
      product.metadata?.images?.[0] ??
      'https://placehold.co/720x540?text=SharkBee'
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
