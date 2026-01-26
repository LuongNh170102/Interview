import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@vhandelivery/shared-ui';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, EMPTY, finalize } from 'rxjs';
import { TranslatePipe } from '@vhandelivery/shared-ui';
import { GlobalModalService } from '../../../shared/components/global-modal/global-modal.service';
import { TranslationService } from '@vhandelivery/shared-ui';

@Component({
  standalone: true,
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
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

  readonly isDisabled = computed(
    () => this.loading() === true || this.form.invalid
  );

  togglePasswordVisibility(): void {
    this.passwordVisible.update((value) => !value);
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
        this.router.navigateByUrl('/landing');
      });
  }
}
