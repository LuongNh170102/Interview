import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { OrderResponse, OrderService } from '@vhandelivery/shared-ui';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="orders-page">
      <header class="page-header">
        <div>
          <p>Order Management</p>
          <h1>Orders</h1>
          <span>Review orders created from the B2C checkout flow.</span>
        </div>
        <button type="button" (click)="loadOrders()">Refresh</button>
      </header>

      @if (errorMessage()) {
      <div class="state state-error">
        <span>{{ errorMessage() }}</span>
        <button type="button" (click)="loadOrders()">Try again</button>
      </div>
      }

      @if (isLoading()) {
      <div class="state">Loading orders...</div>
      } @else if (orders().length === 0 && !errorMessage()) {
      <div class="state">No orders found.</div>
      } @else {
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Merchant</th>
              <th>Courier</th>
              <th>Total</th>
              <th>Status</th>
              <th>Payment</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            @for (order of orders(); track order.id) {
            <tr>
              <td>
                <strong>#{{ order.id }}</strong>
                <span>{{ shortId(order.externalId) }}</span>
              </td>
              <td>{{ order.user?.username || order.user?.email || '-' }}</td>
              <td>{{ getLocalizedName(order.merchant?.name) || '-' }}</td>
              <td>{{ order.courier?.name || '-' }}</td>
              <td>{{ formatMoney(order.totalAmount, order.currency) }}</td>
              <td>
                <span class="badge">{{ order.status || '-' }}</span>
              </td>
              <td>
                <span class="badge badge-muted">{{ order.paymentStatus || '-' }}</span>
              </td>
              <td>{{ formatDate(order.createdAt) }}</td>
            </tr>
            }
          </tbody>
        </table>
      </div>

      <footer class="pagination">
        <button type="button" [disabled]="page() <= 1" (click)="loadOrders(page() - 1)">
          Previous
        </button>
        <span>Page {{ page() }} / {{ lastPage() }}</span>
        <button
          type="button"
          [disabled]="page() >= lastPage()"
          (click)="loadOrders(page() + 1)"
        >
          Next
        </button>
      </footer>
      }
    </section>
  `,
  styles: [
    `
      .orders-page {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .page-header {
        align-items: flex-end;
        display: flex;
        justify-content: space-between;
        gap: 16px;
      }

      .page-header p {
        color: var(--color-primary);
        font-weight: 700;
        margin: 0 0 6px;
      }

      .page-header h1 {
        color: var(--color-text-primary);
        font-size: 32px;
        font-weight: 800;
        margin: 0 0 6px;
      }

      .page-header span,
      td span {
        color: var(--color-text-secondary);
        font-size: 13px;
      }

      button {
        border: 1px solid var(--color-primary);
        color: var(--color-primary);
        font-weight: 700;
        padding: 10px 14px;
      }

      .page-header button {
        background: var(--color-primary);
        color: white;
      }

      .state {
        background: var(--color-surface);
        border: 1px solid var(--color-border);
        color: var(--color-text-secondary);
        padding: 20px;
      }

      .state-error {
        align-items: center;
        background: #fef2f2;
        color: #991b1b;
        display: flex;
        justify-content: space-between;
      }

      .table-wrap {
        background: var(--color-surface);
        border: 1px solid var(--color-border);
        overflow-x: auto;
      }

      table {
        border-collapse: collapse;
        min-width: 940px;
        width: 100%;
      }

      th,
      td {
        border-bottom: 1px solid var(--color-border);
        padding: 14px;
        text-align: left;
      }

      th {
        color: var(--color-text-secondary);
        font-size: 12px;
        text-transform: uppercase;
      }

      td {
        color: var(--color-text-primary);
      }

      td:first-child {
        display: flex;
        flex-direction: column;
        gap: 3px;
      }

      .badge {
        background: #dcfce7;
        color: #166534;
        display: inline-flex;
        font-weight: 700;
        padding: 4px 9px;
      }

      .badge-muted {
        background: #f1f5f9;
        color: #475569;
      }

      .pagination {
        align-items: center;
        display: flex;
        justify-content: center;
        gap: 14px;
      }

      button:disabled {
        cursor: not-allowed;
        opacity: 0.45;
      }

      @media (max-width: 720px) {
        .page-header {
          align-items: stretch;
          flex-direction: column;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdersComponent implements OnInit {
  private readonly orderService = inject(OrderService);

  protected readonly orders = signal<OrderResponse[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly page = signal(1);
  protected readonly lastPage = signal(1);
  protected readonly limit = 10;

  ngOnInit(): void {
    this.loadOrders();
  }

  protected loadOrders(page = this.page()): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.orderService
      .findAll({ page, limit: this.limit })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (response) => {
          this.orders.set(response.data);
          this.page.set(response.meta.page);
          this.lastPage.set(Math.max(1, response.meta.lastPage));
        },
        error: () => {
          this.errorMessage.set('Could not load orders.');
        },
      });
  }

  protected shortId(value?: string): string {
    return value ? value.slice(0, 8) : '-';
  }

  protected getLocalizedName(value: unknown): string {
    if (!value) {
      return '';
    }
    if (typeof value === 'string') {
      return value;
    }
    if (typeof value === 'object') {
      const record = value as Record<string, string | undefined>;
      return record['vi'] ?? record['en'] ?? Object.values(record)[0] ?? '';
    }
    return '';
  }

  protected formatMoney(value: unknown, currency?: string | null): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: currency || 'VND',
      maximumFractionDigits: 0,
    }).format(this.toNumber(value));
  }

  protected formatDate(value?: string | Date): string {
    if (!value) {
      return '-';
    }
    return new Intl.DateTimeFormat('vi-VN', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(value));
  }

  private toNumber(value: unknown): number {
    if (typeof value === 'number') {
      return value;
    }
    if (typeof value === 'string') {
      return Number(value);
    }
    if (value && typeof value === 'object') {
      const decimal = value as { s?: number; e?: number; d?: number[] };
      if (decimal.d?.length) {
        const digits = decimal.d.join('');
        const exponent = decimal.e ?? digits.length - 1;
        return (
          Number(digits) *
          Math.sign(decimal.s ?? 1) *
          10 ** (exponent - digits.length + 1)
        );
      }
    }
    return 0;
  }
}
