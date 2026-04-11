import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { ProductService } from '../../shared/services/product.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  private productService = inject(ProductService);

  readonly featuredProducts = signal<any[]>([]);

  constructor() {
    this.productService.findAll({ limit: 8 }).subscribe((res) => {
      this.featuredProducts.set(res.data);
    });
  }
}
