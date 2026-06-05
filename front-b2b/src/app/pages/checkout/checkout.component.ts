import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { OrderResponse, OrderService } from '@vhandelivery/shared-ui';
import { finalize } from 'rxjs';
import { CartService, parseProductPrice } from '../../shared/services/cart.service';

type CheckoutForm = {
  fullName: string;
  phone: string;
  addressLine: string;
  note: string;
  latitude: number;
  longitude: number;
};

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckoutComponent {
  private readonly orderService = inject(OrderService);
  protected readonly cart = inject(CartService);

  protected readonly form = signal<CheckoutForm>({
    fullName: '',
    phone: '',
    addressLine: '',
    note: '',
    latitude: 10.7769,
    longitude: 106.7009,
  });
  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly createdOrder = signal<OrderResponse | null>(null);
  protected readonly isFormValid = computed(() => {
    const form = this.form();
    return (
      this.cart.items().length > 0 &&
      form.fullName.trim().length > 0 &&
      form.phone.trim().length > 0 &&
      form.addressLine.trim().length > 0
    );
  });

  protected updateForm<K extends keyof CheckoutForm>(
    field: K,
    value: CheckoutForm[K]
  ): void {
    this.form.update((form) => ({ ...form, [field]: value }));
  }

  protected updateQuantity(productExternalId: string, value: string): void {
    this.cart.updateQuantity(productExternalId, Number(value));
  }

  protected submit(): void {
    if (!this.isFormValid() || this.isSubmitting()) {
      return;
    }

    const merchantId = this.cart.merchantExternalId();
    if (!merchantId) {
      this.errorMessage.set('Giỏ hàng thiếu thông tin cửa hàng.');
      return;
    }

    const form = this.form();
    this.isSubmitting.set(true);
    this.errorMessage.set('');

    this.orderService
      .create({
        merchantId,
        items: this.cart.items().map((item) => ({
          productId: item.product.externalId,
          quantity: item.quantity,
        })),
        deliveryAddress: {
          fullName: form.fullName.trim(),
          phone: form.phone.trim(),
          addressLine: form.addressLine.trim(),
          note: form.note.trim(),
        },
        customerLocation: {
          latitude: Number(form.latitude),
          longitude: Number(form.longitude),
        },
      })
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: (order) => {
          this.createdOrder.set(order);
          this.cart.clear();
        },
        error: (error) => {
          this.errorMessage.set(
            error?.error?.message || 'Không thể tạo đơn hàng. Vui lòng thử lại.'
          );
        },
      });
  }

  protected formatMoney(value: Parameters<typeof parseProductPrice>[0]): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(parseProductPrice(value));
  }
}
