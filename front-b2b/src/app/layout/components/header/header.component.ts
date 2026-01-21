import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  inject,
  input,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import {
  AuthService,
  TranslatePipe,
  TranslationService,
} from '@vhandelivery/shared-ui';
import { GlobalModalService } from '../../../shared/components/global-modal/global-modal.service';

type NavItem = {
  readonly labelKey: string;
  readonly link: string;
  readonly active?: boolean;
};

@Component({
  selector: 'app-header',
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
  protected isLanguageDropdownOpen = signal(false);

  protected isRouterLink(link: string | undefined): boolean {
    return !!link && link.startsWith('/');
  }

  protected async handleNavigation(
    event: MouseEvent,
    link: string | undefined
  ): Promise<void> {
    if (!link) {
      return;
    }

    event.preventDefault();

    if (typeof window === 'undefined') {
      return;
    }

    if (link.startsWith('#')) {
      // '#' should scroll to top
      if (link === '#') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      try {
        const target = document.querySelector(link);

        if (target) {
          (target as HTMLElement).scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } catch (err) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    if (link.includes('#')) {
      const [path, fragment] = link.split('#');
      const currentUrl = this.router.url.split('#')[0];

      if (currentUrl === path || currentUrl === `/${path}`) {
        await this.router.navigate([], {
          fragment,
          queryParamsHandling: 'preserve',
        });

        if (!fragment) {
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }

        try {
          const target = document.querySelector(`#${fragment}`);
          if (target) {
            (target as HTMLElement).scrollIntoView({
              behavior: 'smooth',
              block: 'start',
            });
            return;
          }
        } catch (err) {
          // Continue to navigation if selector fails
        }
      }

      await this.router.navigateByUrl(link);

      setTimeout(() => {
        try {
          const target = document.querySelector(`#${fragment}`);
          if (target) {
            (target as HTMLElement).scrollIntoView({
              behavior: 'smooth',
              block: 'start',
            });
          }
        } catch (err) {
          // Ignore scroll errors
        }
      }, 100);
      return;
    }

    await this.router.navigateByUrl(link);
  }

  protected toggleLanguageDropdown(): void {
    this.isLanguageDropdownOpen.update((prev) => !prev);
  }

  protected selectLanguage(lang: string): void {
    if (lang !== this.currentLanguage()) {
      this.translationService.setLanguage(lang);
      this.currentLanguage.set(lang);
    }
    this.isLanguageDropdownOpen.set(false);
  }

  protected logout() {
    this.modalService.showConfirmation(
      'modal.logoutConfirmTitle',
      'modal.logoutConfirmMessage',
      () => {
        this.auth.logout().subscribe(() => {
          this.router.navigate(['/auth/login']);
        });
      }
    );
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isLanguageDropdownOpen.set(false);
    }
  }

  protected get currentLanguageOption() {
    return this.languageOptions.find(
      (opt) => opt.value === this.currentLanguage()
    );
  }
}
