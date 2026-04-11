import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { ProductService } from '../../shared/services/product.service';
import { Product } from '../../shared/interfaces/product.interface';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './product-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductListComponent {
  private productService = inject(ProductService);

  readonly products = signal<Product[]>([]);
  readonly isLoading = signal(true);

  constructor() {
    this.loadProducts();
  }

  private loadProducts() {
    this.productService.findAll({ limit: 20 }).subscribe({
      next: (res) => {
        this.products.set(res.data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }
}
