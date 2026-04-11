import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CartService } from '../../shared/services/cart.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './cart.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartComponent {
  readonly cartService = inject(CartService);

  increase(item: any) {
    this.cartService.updateQuantity(item.productId, item.quantity + 1);
  }

  decrease(item: any) {
    this.cartService.updateQuantity(item.productId, item.quantity - 1);
  }

  remove(item: any) {
    this.cartService.removeFromCart(item.productId);
  }

  checkout() {
    if (this.cartService.totalItems() === 0) return;
    alert('Chuyển đến trang thanh toán / tạo order (sẽ triển khai sau)');
  }
}
