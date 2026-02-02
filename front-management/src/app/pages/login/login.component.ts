import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '@vhandelivery/shared-ui';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, EMPTY, finalize } from 'rxjs';
import { TranslatePipe } from '@vhandelivery/shared-ui';
import { TranslationService } from '@vhandelivery/shared-ui';
import { GlobalModalService } from '../../shared/components/global-modal/global-modal.service';
import { GoogleLinkModalComponent } from './components/google-link-modal/google-link-modal.component';

@Component({
  standalone: true,
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    TranslatePipe,
    GoogleLinkModalComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly modalService = inject(GlobalModalService);
  private readonly translationService = inject(TranslationService);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    remember: [false],
  });

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly passwordVisible = signal(false);

  // Google OAuth states
  readonly showLinkingModal = signal(false);
  readonly googleLinkingData = signal<{
    email: string;
    googleId: string;
    displayName: string;
    avatarUrl: string;
  } | null>(null);
  readonly linkingLoading = signal(false);
  readonly linkingError = signal<string | null>(null);

  readonly isDisabled = computed(
    () => this.loading() === true || this.form.invalid
  );

  ngOnInit(): void {
    // Handle Google OAuth callback
    this.route.queryParams
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        if (params['success'] === 'true' && params['access_token']) {
          try {
            const user = JSON.parse(params['user'] || '{}');
            const permissions = JSON.parse(params['permissions'] || '[]');

            this.auth.persistGoogleAuth(
              params['access_token'],
              user,
              permissions
            );

            this.modalService.showSuccess(
              this.translationService.translate('auth.login.successTitle'),
              this.translationService.translate('auth.google.loginSuccess')
            );

            // Navigate directly to dashboard (replaceUrl clears the query params from history)
            this.router.navigateByUrl('/dashboard', { replaceUrl: true });
          } catch {
            this.modalService.showError(
              this.translationService.translate('auth.login.errorTitle'),
              'Failed to process Google login response'
            );
          }
        } else if (params['requiresLinking'] === 'true') {
          // Account linking required - show modal
          this.googleLinkingData.set({
            email: params['email'] || '',
            googleId: params['googleId'] || '',
            displayName: params['displayName'] || '',
            avatarUrl: params['avatarUrl'] || '',
          });
          this.showLinkingModal.set(true);
          // Clear URL params
          this.router.navigate([], {
            relativeTo: this.route,
            queryParams: {},
            replaceUrl: true,
          });
        } else if (params['error']) {
          this.modalService.showError(
            this.translationService.translate('auth.login.errorTitle'),
            decodeURIComponent(params['error'])
          );
          // Clear URL params
          this.router.navigate([], {
            relativeTo: this.route,
            queryParams: {},
            replaceUrl: true,
          });
        }
      });
  }

  togglePasswordVisibility(): void {
    this.passwordVisible.update((value) => !value);
  }

  // Google OAuth login
  loginWithGoogle(): void {
    this.auth.loginWithGoogle();
  }

  // Close linking modal
  closeLinkingModal(): void {
    this.showLinkingModal.set(false);
    this.googleLinkingData.set(null);
    this.linkingError.set(null);
  }

  // Submit account linking
  submitLinking(password: string): void {
    const linkingData = this.googleLinkingData();
    if (this.linkingLoading() || !linkingData) return;

    this.linkingLoading.set(true);
    this.linkingError.set(null);

    this.auth
      .linkGoogleAccount({
        email: linkingData.email,
        password,
        googleId: linkingData.googleId,
        displayName: linkingData.displayName,
        avatarUrl: linkingData.avatarUrl,
      })
      .pipe(
        catchError((err) => {
          const message =
            err?.error?.message || err?.message || 'auth.error.linkFailed';
          this.linkingError.set(message);
          return EMPTY;
        }),
        finalize(() => this.linkingLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.closeLinkingModal();
        this.modalService.showSuccess(
          this.translationService.translate('auth.login.successTitle'),
          this.translationService.translate('auth.google.linkSuccess')
        );
        this.router.navigateByUrl('/dashboard');
      });
  }

  submit() {
    if (this.form.invalid || this.loading()) return;
    this.loading.set(true);
    this.error.set(null);

    const { email, password } = this.form.getRawValue();

    this.auth
      .login({ email, password })
      .pipe(
        catchError((err) => {
          const message =
            err?.error?.message || err?.message || 'auth.error.loginFailed';
          this.error.set(message);
          this.modalService.showError(
            this.translationService.translate('auth.login.errorTitle'),
            this.translationService.translate(message)
          );
          return EMPTY;
        }),
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.modalService.showSuccess(
          this.translationService.translate('auth.login.successTitle'),
          this.translationService.translate('auth.login.successMessage')
        );
        this.router.navigateByUrl('/dashboard');
      });
  }
}
