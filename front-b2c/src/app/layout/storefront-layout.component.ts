import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from '@vhandelivery/shared-ui';

@Component({
  selector: 'app-storefront-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  template: `
    <header class="header">
      <a routerLink="/" class="logo">VhanDelivery</a>
      <nav>
        <a routerLink="/">Sản phẩm</a>
        <a routerLink="/cart">Giỏ hàng</a>
        @if (auth.isAuthenticated()) {
          <span class="user">{{ auth.currentUser()?.email }}</span>
        } @else {
          <a routerLink="/login">Đăng nhập</a>
        }
      </nav>
    </header>
    <main class="main">
      <router-outlet />
    </main>
  `,
  styles: [
    `
      :host {
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI',
          Roboto, 'Helvetica Neue', Arial, sans-serif;
      }
      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 1.5rem;
        border-bottom: 1px solid #e5e7eb;
        background: #fff;
      }
      .logo {
        font-weight: 700;
        font-size: 1.25rem;
        color: #111;
        text-decoration: none;
      }
      nav {
        display: flex;
        gap: 1rem;
        align-items: center;
      }
      nav a,
      .user {
        color: #374151;
        text-decoration: none;
        font-size: 0.95rem;
      }
      .main {
        max-width: 1332px;
        margin: 0 auto;
        padding: 1.25rem 1.5rem 2rem;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StorefrontLayoutComponent {
  readonly auth = inject(AuthService);
}
