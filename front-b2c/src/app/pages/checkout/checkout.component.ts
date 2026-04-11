import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CartService } from '../../shared/services/cart.service';
import { OrderService } from '../../shared/services/order.service';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './checkout.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckoutComponent {
  private cartService = inject(CartService);
  private orderService = inject(OrderService);
  private router = inject(Router);

  readonly isSubmitting = signal(false);

  // Form data
  shippingAddress = '';
  phone = '';
  note = '';

  get cartItems() {
    return this.cartService.items();
  }

  get totalPrice() {
    return this.cartService.totalPrice();
  }

  createOrder() {
    if (!this.shippingAddress || !this.phone) {
      alert('Vui lòng nhập đầy đủ địa chỉ và số điện thoại');
      return;
    }

    this.isSubmitting.set(true);

    this.orderService
      .createOrderFromCart(this.shippingAddress, this.phone, this.note)
      .subscribe({
        next: (order) => {
          alert(`Đặt hàng thành công! Mã đơn hàng: ${order.orderId}`);
          this.cartService.clearCart();
          this.router.navigate(['/']);
        },
        error: (err) => {
          alert('Đặt hàng thất bại. Vui lòng thử lại.');
          console.error(err);
        },
        complete: () => this.isSubmitting.set(false),
      });
  }
}
