import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  AuthService,
  CreateOrderRequest,
  OrderResponse,
  OrderService,
  TranslatePipe,
  TranslationService,
} from '@vhandelivery/shared-ui';
import { CartStore } from '../../cart.store';

@Component({
  standalone: true,
  selector: 'app-cart-page',
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslatePipe],
  template: `
    @if (orderResult(); as order) {
    <section class="checkout-shell success-card">
      <p class="eyebrow">{{ 'b2c.cart.success.eyebrow' | translate }}</p>
      <h1>{{ 'b2c.cart.success.title' | translate }}</h1>
      <p>
        {{ 'b2c.cart.success.orderCode' | translate }}: {{ order.externalId }}
      </p>
      <p>{{ 'b2c.cart.success.status' | translate }}: {{ order.status }}</p>
      <p>
        {{ 'b2c.cart.success.total' | translate }}:
        {{ order.totalAmount.toLocaleString('vi-VN') }}
        {{ order.currency }}
      </p>
      @if (order.courierExternalId) {
      <p>
        {{ 'b2c.cart.success.assignedCourier' | translate }}:
        {{ order.courierExternalId }}
      </p>
      }
    </section>
    } @else if (cartStore.items().length === 0) {
    <section class="checkout-shell empty-card">
      <h1>{{ 'b2c.cart.empty.title' | translate }}</h1>
      <p>
        {{ 'b2c.cart.empty.description' | translate }}
      </p>
    </section>
    } @else {
    <section class="checkout-shell">
      <article class="cart-card">
        <p class="eyebrow">{{ 'b2c.cart.summary.eyebrow' | translate }}</p>
        <h1>{{ 'b2c.cart.summary.title' | translate }}</h1>
        <p class="section-copy">
          {{ 'b2c.cart.summary.description' | translate }}
        </p>

        <div class="cart-items">
          @for (item of cartStore.items(); track item.productId) {
          <div class="cart-item">
            <div>
              <h2>{{ item.name }}</h2>
              <p>{{ item.merchantName }}</p>
              <strong
                >{{ item.price.toLocaleString('vi-VN') }}
                {{ item.currency }}</strong
              >
            </div>

            <div class="quantity-controls">
              <button
                type="button"
                (click)="
                  cartStore.updateQuantity(item.productId, item.quantity - 1)
                "
              >
                -
              </button>
              <span>{{ item.quantity }}</span>
              <button
                type="button"
                (click)="
                  cartStore.updateQuantity(item.productId, item.quantity + 1)
                "
              >
                +
              </button>
            </div>
          </div>
          }
        </div>

        <div class="summary-row">
          <span>{{ 'b2c.cart.summary.subtotal' | translate }}</span>
          <strong
            >{{ cartStore.subtotal().toLocaleString('vi-VN') }} VND</strong
          >
        </div>
      </article>

      <article class="checkout-card">
        @if (!auth.isAuthenticated()) {
        <div class="auth-card">
          <p class="eyebrow">{{ 'b2c.cart.auth.eyebrow' | translate }}</p>
          <h2>{{ 'b2c.cart.auth.title' | translate }}</h2>
          <p>
            {{ 'b2c.cart.auth.description' | translate }}
          </p>

          <div class="auth-actions">
            <a
              routerLink="/auth"
              [queryParams]="{ mode: 'login', returnUrl: '/cart' }"
              class="primary-link"
              >{{ 'b2c.cart.auth.login' | translate }}</a
            >
            <a
              routerLink="/auth"
              [queryParams]="{ mode: 'register', returnUrl: '/cart' }"
              class="secondary-link"
              >{{ 'b2c.cart.auth.register' | translate }}</a
            >
          </div>
        </div>
        } @else {
        <form
          [formGroup]="deliveryForm"
          (ngSubmit)="placeOrder()"
          class="delivery-form"
        >
          <p class="eyebrow">{{ 'b2c.cart.checkout.eyebrow' | translate }}</p>
          <h2>{{ 'b2c.cart.checkout.title' | translate }}</h2>
          <p class="section-copy">
            {{ 'b2c.cart.checkout.descriptionPrefix' | translate }}
            {{ auth.currentUser()?.email }}.
            {{ 'b2c.cart.checkout.descriptionSuffix' | translate }}
          </p>
          <input
            type="text"
            formControlName="fullName"
            [placeholder]="'b2c.cart.form.fullName' | translate"
          />
          <input
            type="text"
            formControlName="phone"
            [placeholder]="'b2c.cart.form.phone' | translate"
          />
          <input
            type="text"
            formControlName="addressLine1"
            [placeholder]="'b2c.cart.form.addressLine1' | translate"
          />
          <input
            type="text"
            formControlName="addressLine2"
            [placeholder]="'b2c.cart.form.addressLine2' | translate"
          />
          <input
            type="text"
            formControlName="city"
            [placeholder]="'b2c.cart.form.city' | translate"
          />
          <textarea
            formControlName="note"
            rows="3"
            [placeholder]="'b2c.cart.form.note' | translate"
          ></textarea>

          @if (checkoutError()) {
          <p class="error-text">{{ checkoutError() }}</p>
          }

          <button type="submit" [disabled]="isCheckoutSubmitting()">
            {{ 'b2c.cart.checkout.placeOrder' | translate }}
          </button>
        </form>
        }
      </article>
    </section>
    }
  `,
  styles: [
    `
      .checkout-shell {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 420px);
        gap: 1.5rem;
      }
      .cart-card,
      .checkout-card,
      .success-card,
      .empty-card {
        border-radius: 28px;
        border: 1px solid rgba(42, 34, 20, 0.08);
        background: rgba(255, 255, 255, 0.88);
        padding: 1.5rem;
        box-shadow: 0 24px 60px rgba(76, 46, 20, 0.08);
      }
      .eyebrow {
        margin: 0 0 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #c2561a;
        font-size: 0.8rem;
        font-weight: 700;
      }
      h1,
      h2 {
        margin-top: 0;
      }
      .section-copy {
        color: #5b4f42;
        line-height: 1.6;
        margin-top: 0;
      }
      .cart-items {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }
      .cart-item {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid rgba(42, 34, 20, 0.08);
      }
      .cart-item p {
        margin: 0.35rem 0;
        color: #8a775f;
      }
      .quantity-controls {
        display: inline-flex;
        align-items: center;
        gap: 0.75rem;
      }
      .quantity-controls button,
      .delivery-form button {
        border: 0;
        border-radius: 999px;
        cursor: pointer;
      }
      .quantity-controls button {
        width: 2rem;
        height: 2rem;
        background: #fff4e6;
      }
      .summary-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-top: 1rem;
      }
      .checkout-card {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }
      .auth-card {
        display: grid;
        gap: 1rem;
        padding: 0.25rem 0;
      }
      .auth-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
      }
      .primary-link,
      .secondary-link,
      .delivery-form {
        text-decoration: none;
      }
      .primary-link,
      .secondary-link {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0.95rem 1.2rem;
        border-radius: 999px;
      }
      .primary-link {
        background: #c2561a;
        color: white;
      }
      .secondary-link {
        background: #fff4e6;
        color: #20160d;
      }
      input,
      textarea {
        width: 100%;
        border: 1px solid rgba(42, 34, 20, 0.12);
        border-radius: 16px;
        padding: 0.9rem 1rem;
        background: white;
      }
      .delivery-form {
        display: grid;
        gap: 0.75rem;
      }
      .delivery-form button {
        padding: 0.95rem 1.2rem;
        background: #c2561a;
        color: white;
      }
      .error-text {
        color: #9f1c1c;
        margin: 0;
      }
      @media (max-width: 900px) {
        .checkout-shell {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class CartPageComponent {
  readonly cartStore = inject(CartStore);
  readonly auth = inject(AuthService);
  private readonly orderService = inject(OrderService);
  private readonly fb = inject(FormBuilder);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly translationService = inject(TranslationService);

  readonly isCheckoutSubmitting = signal(false);
  readonly checkoutError = signal<string | null>(null);
  readonly orderResult = signal<OrderResponse | null>(null);
  readonly canCheckout = computed(
    () => this.auth.isAuthenticated() && this.cartStore.items().length > 0
  );

  readonly deliveryForm = this.fb.nonNullable.group({
    fullName: ['', [Validators.required]],
    phone: ['', [Validators.required]],
    addressLine1: ['', [Validators.required]],
    addressLine2: [''],
    city: ['', [Validators.required]],
    note: [''],
  });

  ngOnInit(): void {
    this.title.setTitle(this.t('b2c.cart.meta.title'));
    this.meta.updateTag({
      name: 'description',
      content: this.t('b2c.cart.meta.description'),
    });
  }

  placeOrder(): void {
    if (!this.canCheckout() || this.deliveryForm.invalid) {
      this.deliveryForm.markAllAsTouched();
      return;
    }

    this.isCheckoutSubmitting.set(true);
    this.checkoutError.set(null);

    const payload: CreateOrderRequest = {
      items: this.cartStore.items().map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
      deliveryAddress: this.deliveryForm.getRawValue(),
    };

    this.orderService.create(payload).subscribe({
      next: (response) => {
        this.orderResult.set(response);
        this.cartStore.clear();
        this.isCheckoutSubmitting.set(false);
      },
      error: (error) => {
        this.checkoutError.set(
          error?.error?.message ?? this.t('b2c.cart.errors.checkout')
        );
        this.isCheckoutSubmitting.set(false);
      },
    });
  }

  private t(key: string): string {
    return this.translationService.translate(key);
  }
}
