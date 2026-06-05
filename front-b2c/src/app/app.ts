import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  ElementRef,
  HostListener,
  inject,
  signal,
} from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import {
  AuthService,
  TranslatePipe,
  TranslationService,
} from '@vhandelivery/shared-ui';
import { CartStore } from './cart.store';

@Component({
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    TranslatePipe,
  ],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly auth = inject(AuthService);
  protected readonly cartStore = inject(CartStore);
  private readonly translationService = inject(TranslationService);
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  protected readonly cartCount = computed(() => this.cartStore.totalItems());
  protected readonly isAccountMenuOpen = signal(false);

  protected toggleAccountMenu(): void {
    this.isAccountMenuOpen.update((value) => !value);
  }

  protected closeAccountMenu(): void {
    this.isAccountMenuOpen.set(false);
  }

  protected accountRoleLabel(): string {
    const roles = this.auth.currentUser()?.roles ?? [];

    if (roles.includes('SUPER_ADMIN')) {
      return this.translationService.translate(
        'b2c.shell.account.roles.superAdmin'
      );
    }

    if (roles.includes('CUSTOMER')) {
      return this.translationService.translate(
        'b2c.shell.account.roles.customer'
      );
    }

    const [firstRole] = roles;
    if (!firstRole) {
      return this.translationService.translate(
        'b2c.shell.account.roles.account'
      );
    }

    return firstRole
      .toLowerCase()
      .split('_')
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(' ');
  }

  @HostListener('document:click', ['$event'])
  protected handleDocumentClick(event: MouseEvent): void {
    const target = event.target as Node | null;
    const menu = this.elementRef.nativeElement.querySelector('.account-menu');

    if (this.isAccountMenuOpen() && menu && target && !menu.contains(target)) {
      this.closeAccountMenu();
    }
  }

  logout(): void {
    this.closeAccountMenu();
    this.auth.logout().subscribe();
  }
}
