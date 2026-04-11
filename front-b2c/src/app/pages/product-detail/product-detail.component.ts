import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterModule } from '@angular/router';

import { Product } from '../../shared/interfaces/product.interface';
import { CartService } from '../../shared/services/cart.service';
import { ProductService } from '../../shared/services/product.service';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './product-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private productService = inject(ProductService);
  private cartService = inject(CartService);
  private titleService = inject(Title);
  private metaService = inject(Meta);

  readonly product = signal<Product | null>(null);
  readonly isLoading = signal(true);
  readonly quantity = signal(1);

  ngOnInit(): void {
    const externalId = this.route.snapshot.paramMap.get('externalId')!;
    this.loadProduct(externalId);
  }

  private loadProduct(externalId: string): void {
    this.productService.findByExternalId(externalId).subscribe({
      next: (product) => {
        this.product.set(product);
        this.isLoading.set(false);
        this.updateSEO(product);
      },
      error: () => {
        this.isLoading.set(false);
        this.titleService.setTitle('Không tìm thấy sản phẩm | VHan Delivery');
      },
    });
  }

  private updateSEO(product: Product): void {
    // Title
    this.titleService.setTitle(`${product.name} | VHan Delivery`);

    // Meta Description
    this.metaService.updateTag({
      name: 'description',
      content: product.description
        ? `${product.description.substring(0, 160)}...`
        : `Mua ${product.name} với giá ${product.price.toLocaleString(
            'vi-VN'
          )} ₫ tại VHan Delivery`,
    });

    // Open Graph Tags
    this.metaService.updateTag({ property: 'og:title', content: product.name });
    this.metaService.updateTag({
      property: 'og:description',
      content:
        product.description ||
        `Giá: ${product.price.toLocaleString('vi-VN')} ₫`,
    });
    this.metaService.updateTag({
      property: 'og:image',
      content:
        product.thumbnail || 'https://yourdomain.com/assets/og-image.jpg',
    });
    this.metaService.updateTag({ property: 'og:type', content: 'product' });
    this.metaService.updateTag({
      property: 'og:site_name',
      content: 'VHan Delivery',
    });

    // Twitter Card
    this.metaService.updateTag({
      name: 'twitter:card',
      content: 'summary_large_image',
    });
    this.metaService.updateTag({
      name: 'twitter:title',
      content: product.name,
    });
    this.metaService.updateTag({
      name: 'twitter:description',
      content:
        product.description ||
        `Giá chỉ từ ${product.price.toLocaleString('vi-VN')} ₫`,
    });
  }

  increment(): void {
    this.quantity.update((q) => q + 1);
  }

  decrement(): void {
    this.quantity.update((q) => Math.max(1, q - 1));
  }

  addToCart(): void {
    const currentProduct = this.product();
    if (!currentProduct) return;

    this.cartService.addToCart({
      productId: currentProduct.externalId,
      name:
        typeof currentProduct.name === 'string'
          ? currentProduct.name
          : (currentProduct.name as any)?.vi || currentProduct.name,
      price: currentProduct.price,
      thumbnail: currentProduct.thumbnail,
      quantity: this.quantity(),
    });

    alert('Sản phẩm đã được thêm vào giỏ hàng!');
  }
}
