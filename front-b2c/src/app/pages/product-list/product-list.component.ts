import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { B2CProductService, B2CProduct } from '../../services/product.service';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductListComponent implements OnInit {
  private readonly productService = inject(B2CProductService);
  private readonly cartService = inject(CartService);
  private readonly router = inject(Router);

  readonly products = signal<B2CProduct[]>([]);
  readonly isLoading = signal(false);
  readonly cartCount = this.cartService.count;

  ngOnInit(): void {
    this.isLoading.set(true);
    this.productService.findAll().subscribe({
      next: (data) => { this.products.set(data); this.isLoading.set(false); },
      error: (err) => { console.error(err); this.isLoading.set(false); },
    });
  }

  getName(product: B2CProduct): string {
    if (typeof product.name === 'object') return product.name?.vi || product.name?.en || '';
    return product.name ?? '';
  }

  addToCart(product: B2CProduct, event: Event): void {
    event.stopPropagation();
    this.cartService.addToCart(product);
  }

  goToDetail(product: B2CProduct): void {
    this.router.navigate(['/products', product.externalId]);
  }

  goToCart(): void {
    this.router.navigate(['/cart']);
  }
}