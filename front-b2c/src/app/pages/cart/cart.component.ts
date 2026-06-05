import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AuthService,
  CartItemResponse,
  formatMoneyVN,
  OrderService,
} from '@vhandelivery/shared-ui';
import { CartStateService } from '../../services/cart-state.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartComponent implements OnInit {
  private readonly orderService = inject(OrderService);
  private readonly cartState = inject(CartStateService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  readonly skeletonItems = [1, 2, 3];
  readonly cart = this.cartState.cart;
  readonly isLoading = this.cartState.isLoading;
  readonly submitting = signal(false);
  readonly message = signal('');
  readonly merchantId = this.cartState.merchantId;

  readonly checkoutForm = this.fb.group({
    address: ['', Validators.required],
    latitude: [10.7769, Validators.required],
    longitude: [106.7009, Validators.required],
    phone: ['', Validators.required],
  });

  ngOnInit(): void {
    this.title.setTitle('Giỏ hàng | VhanDelivery');
    this.meta.updateTag({
      name: 'description',
      content: 'Xem và quản lý giỏ hàng của bạn trên VhanDelivery',
    });

    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/cart' } });
      return;
    }

    if (!this.merchantId()) {
      this.isLoading.set(false);
      return;
    }

    this.loadCart();
  }

  private loadCart(): void {
    this.cartState
      .loadCart()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: () => {
          this.message.set('Không thể tải giỏ hàng');
        },
      });
  }

  getItemName(item: CartItemResponse): string {
    return item.product?.name?.vi ?? 'Sản phẩm';
  }

  getItemPrice(item: CartItemResponse): string {
    return formatMoneyVN(item.total);
  }

  getTotal(): string {
    return formatMoneyVN(this.cart()?.totalAmount);
  }

  removeItem(productId: string): void {
    this.orderService
      .removeCartItem(this.merchantId(), productId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (cart) => this.cartState.updateCart(cart),
      });
  }

  placeOrder(): void {
    if (this.checkoutForm.invalid) {
      this.checkoutForm.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    const form = this.checkoutForm.value;

    this.orderService
      .createOrder({
        merchantId: this.merchantId(),
        deliveryAddress: {
          address: form.address!,
          latitude: Number(form.latitude),
          longitude: Number(form.longitude),
          phone: form.phone!,
        },
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (order) => {
          this.submitting.set(false);
          this.message.set(
            `Đặt hàng thành công! Mã đơn: ${order.externalId.slice(0, 8)}...`
          );
          this.cartState.clear();
        },
        error: (err) => {
          this.submitting.set(false);
          const msg =
            err?.error?.message ?? 'Đặt hàng thất bại. Vui lòng thử lại.';
          this.message.set(Array.isArray(msg) ? msg.join(', ') : String(msg));
        },
      });
  }
}
