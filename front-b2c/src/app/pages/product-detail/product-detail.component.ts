import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Meta, Title } from '@angular/platform-browser';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-detail.component.html',
})
export class ProductDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly meta = inject(Meta);
  private readonly titleService = inject(Title);
  readonly cartService = inject(CartService);

  readonly product = signal<any | null>(null);
  readonly isLoading = signal(true);
  readonly error = signal<string | null>(null);
  readonly quantity = signal(1);
  readonly addedFeedback = signal(false);

  readonly displayName = computed(() => {
    const p = this.product();
    if (!p) return '';
    return typeof p.name === 'object' ? (p.name.vi || p.name.en || 'Product') : (p.name || 'Product');
  });

  readonly displayDescription = computed(() => {
    const p = this.product();
    if (!p) return '';
    return typeof p.description === 'object' ? (p.description.vi || p.description.en || '') : (p.description || '');
  });

  readonly displayPrice = computed(() =>
    this.product() ? this.cartService.parseDecimal(this.product().price) : 0
  );

  readonly isOutOfStock = computed(() =>
    this.product() ? !this.cartService.isInStock(this.product().stock) : false
  );

  readonly images = computed(() => {
    const p = this.product();
    if (!p) return [];
    return p.metadata?.images || (p.metadata?.thumbnail ? [p.metadata.thumbnail] : []);
  });

  readonly thumbnail = computed(() => {
    const imgs = this.images();
    return imgs.length > 0 ? imgs[0] : null;
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/']);
      return;
    }
    this.loadProduct(id);
  }

  loadProduct(id: string): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.http.get<any>(`/api/products/${id}`).subscribe({
      next: (data) => {
        this.product.set(data);
        this.isLoading.set(false);
        this.updateSeoTags(data);
      },
      error: () => {
        this.error.set('Product not found or unavailable.');
        this.isLoading.set(false);
      },
    });
  }

  private updateSeoTags(data: any): void {
    const name = data.name?.vi || data.name?.en || 'Product';
    const desc = data.description?.vi || data.description?.en || 'Fresh product available at VHan Delivery';
    const price = this.cartService.parseDecimal(data.price);

    this.titleService.setTitle(`${name} – VHan Delivery`);
    this.meta.updateTag({ name: 'description', content: desc });
    this.meta.updateTag({ property: 'og:title', content: name });
    this.meta.updateTag({ property: 'og:description', content: desc });
    this.meta.updateTag({ property: 'og:type', content: 'product' });
    this.meta.updateTag({ property: 'product:price:amount', content: price.toString() });
    this.meta.updateTag({ property: 'product:price:currency', content: 'VND' });
  }

  increaseQty(): void {
    this.quantity.update((q) => q + 1);
  }

  decreaseQty(): void {
    this.quantity.update((q) => Math.max(1, q - 1));
  }

  addToCart(): void {
    const p = this.product();
    if (!p || this.isOutOfStock()) return;

    for (let i = 0; i < this.quantity(); i++) {
      this.cartService.addToCart({
        ...p,
        displayName: this.displayName(),
        price: this.displayPrice(),
        thumbnail: this.thumbnail(),
      });
    }

    this.addedFeedback.set(true);
    setTimeout(() => this.addedFeedback.set(false), 2000);
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  formatPrice(price: number): string {
    return this.cartService.formatPrice(price);
  }

  parseDecimal(val: any): number {
    return this.cartService.parseDecimal(val);
  }
}
