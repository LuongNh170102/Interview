import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cart.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartComponent {
  readonly cartService = inject(CartService);
  private readonly router = inject(Router);

  readonly items = this.cartService.items;
  readonly total = this.cartService.total;

  getName(item: any): string {
    const name = item.product.name;
    if (typeof name === 'object') return name?.vi || name?.en || '';
    return name ?? '';
  }

  increase(externalId: string, current: number): void {
    this.cartService.updateQuantity(externalId, current + 1);
  }

  decrease(externalId: string, current: number): void {
    this.cartService.updateQuantity(externalId, current - 1);
  }

  remove(externalId: string): void {
    this.cartService.removeFromCart(externalId);
  }

  placeOrder(): void {
    alert(`Đặt hàng thành công! Tổng: ${this.total().toLocaleString('vi-VN')} VND`);
    this.cartService.clearCart();
    this.router.navigate(['/products']);
  }

  goBack(): void {
    this.router.navigate(['/products']);
  }
}