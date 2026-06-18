import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { B2CProductService, B2CProduct } from '../../services/product.service';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductDetailComponent implements OnInit {
  private readonly productService = inject(B2CProductService);
  private readonly cartService = inject(CartService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly product = signal<B2CProduct | null>(null);
  readonly isLoading = signal(false);
  readonly added = signal(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.router.navigate(['/products']); return; }
    this.isLoading.set(true);
    this.productService.findOne(id).subscribe({
      next: (p) => { this.product.set(p); this.isLoading.set(false); },
      error: (err) => { console.error(err); this.isLoading.set(false); },
    });
  }

  getName(): string {
    const p = this.product();
    if (!p) return '';
    if (typeof p.name === 'object') return p.name?.vi || p.name?.en || '';
    return p.name ?? '';
  }

  getDescription(): string {
    const p = this.product();
    if (!p) return '';
    if (typeof p.description === 'object') return p.description?.vi || p.description?.en || '';
    return p.description ?? '';
  }

  addToCart(): void {
    const p = this.product();
    if (!p) return;
    this.cartService.addToCart(p);
    this.added.set(true);
    setTimeout(() => this.added.set(false), 2000);
  }

  goBack(): void {
    this.router.navigate(['/products']);
  }

  goToCart(): void {
    this.router.navigate(['/cart']);
  }
}