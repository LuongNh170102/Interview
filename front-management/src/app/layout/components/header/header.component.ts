import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  inject,
  input,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import {
  AuthService,
  TranslatePipe,
  TranslationService,
} from '@vhandelivery/shared-ui';
import { filter } from 'rxjs/operators';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { GlobalModalService } from '../../../shared/components/global-modal/global-modal.service';
import { NavItem } from '../../../shared/types/nav-item.type';

@Component({
  selector: 'app-admin-header',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslatePipe],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  private readonly translationService = inject(TranslationService);
  protected readonly auth = inject(AuthService);
  private readonly modalService = inject(GlobalModalService);
  private readonly router = inject(Router);
  private readonly elementRef = inject(ElementRef);

  readonly navItems = input<readonly NavItem[]>([]);

  protected readonly languageOptions: ReadonlyArray<{
    value: string;
    label: string;
    flag: string;
  }> = [
    { value: 'vi', label: 'Tiếng Việt', flag: 'assets/images/flags/vi.svg' },
    { value: 'en', label: 'English', flag: 'assets/images/flags/en.svg' },
    { value: 'ko', label: '한국어', flag: 'assets/images/flags/ko.svg' },
  ];

  protected readonly currentLanguage = signal(
    this.translationService.getLanguage()
  );
  protected readonly isLanguageDropdownOpen = signal(false);
  protected readonly isUserDropdownOpen = signal(false);
  protected readonly searchQuery = signal('');

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      takeUntilDestroyed()
    )
  );

  private hasNavPermission(item: NavItem): boolean {
    if (item.anyPermissions && item.anyPermissions.length > 0) {
      const permissionKeys = item.anyPermissions.map(
        (p) => `${p.resource}:${p.action}`
      );
      return this.auth.hasAnyPermission(...permissionKeys);
    }

    if (item.permission) {
      const permissionKey = `${item.permission.resource}:${item.permission.action}`;
      return this.auth.hasPermission(permissionKey);
    }

    return true;
  }

  protected readonly activeNavItems = computed(() => {
    const url = this.currentUrl()?.urlAfterRedirects || this.router.url;
    return this.navItems()
      .filter((item) => this.hasNavPermission(item))
      .map((item) => ({
        ...item,
        active: url.startsWith(item.link),
      }));
  });

  protected get currentLanguageOption() {
    return this.languageOptions.find(
      (lang) => lang.value === this.currentLanguage()
    );
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isLanguageDropdownOpen.set(false);
      this.isUserDropdownOpen.set(false);
    }
  }

  protected toggleLanguageDropdown(): void {
    this.isLanguageDropdownOpen.update((prev) => !prev);
    this.isUserDropdownOpen.set(false);
  }

  protected toggleUserDropdown(): void {
    this.isUserDropdownOpen.update((prev) => !prev);
    this.isLanguageDropdownOpen.set(false);
  }

  protected selectLanguage(langValue: string): void {
    this.translationService.setLanguage(langValue as 'vi' | 'en' | 'ko');
    this.currentLanguage.set(langValue);
    this.isLanguageDropdownOpen.set(false);
  }

  protected onSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  protected onSearchSubmit(): void {
    const query = this.searchQuery();
    if (query.trim()) {
      // TODO: Implement global search
      console.log('Search query:', query);
    }
  }

  protected logout(): void {
    this.modalService.showConfirmation(
      this.translationService.translate('modal.logoutConfirmTitle'),
      this.translationService.translate('modal.logoutConfirmMessage'),
      () => {
        this.auth.logout();
        this.router.navigateByUrl('/login');
      }
    );
  }
}
