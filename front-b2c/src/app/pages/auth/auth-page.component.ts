import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  AuthService,
  TranslatePipe,
  TranslationService,
} from '@vhandelivery/shared-ui';
import { CartStore } from '../../cart.store';

@Component({
  standalone: true,
  selector: 'app-auth-page',
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslatePipe],
  template: `
    <section class="auth-layout">
      <article class="intro-card">
        <p class="eyebrow">{{ 'b2c.auth.eyebrow' | translate }}</p>
        <h1>{{ 'b2c.auth.title' | translate }}</h1>
        <p class="intro-copy">
          {{ 'b2c.auth.description' | translate }}
        </p>

        <div class="feature-list">
          <div>
            <strong>{{ cartCount() }}</strong>
            <span>{{ 'b2c.auth.stats.itemsReady' | translate }}</span>
          </div>
          <div>
            <strong>1</strong>
            <span>{{ 'b2c.auth.stats.singleStore' | translate }}</span>
          </div>
          <div>
            <strong>{{ 'b2c.auth.stats.liveApiValue' | translate }}</strong>
            <span>{{ 'b2c.auth.stats.liveApi' | translate }}</span>
          </div>
        </div>

        <div class="support-links">
          <a routerLink="/">{{ 'b2c.auth.support.backCatalog' | translate }}</a>
          <a routerLink="/cart">{{
            'b2c.auth.support.openCart' | translate
          }}</a>
        </div>
      </article>

      <article class="auth-card">
        @if (auth.isAuthenticated()) {
        <div class="signed-in-card">
          <p class="eyebrow">
            {{ 'b2c.auth.authenticated.eyebrow' | translate }}
          </p>
          <h2>{{ 'b2c.auth.authenticated.title' | translate }}</h2>
          <p>
            {{ 'b2c.auth.authenticated.descriptionPrefix' | translate }}
            {{ auth.currentUser()?.email }}.
            {{ 'b2c.auth.authenticated.descriptionSuffix' | translate }}
          </p>
          <div class="auth-actions">
            <button type="button" class="primary-button" (click)="continue()">
              {{ 'b2c.auth.actions.continue' | translate }}
            </button>
            <a routerLink="/" class="secondary-link">{{
              'b2c.auth.actions.keepShopping' | translate
            }}</a>
          </div>
        </div>
        } @else {
        <div class="toggle-row">
          <button
            type="button"
            [class.active]="authMode() === 'login'"
            (click)="setMode('login')"
          >
            {{ 'b2c.auth.modes.login' | translate }}
          </button>
          <button
            type="button"
            [class.active]="authMode() === 'register'"
            (click)="setMode('register')"
          >
            {{ 'b2c.auth.modes.register' | translate }}
          </button>
        </div>

        @if (authMode() === 'login') {
        <form
          [formGroup]="loginForm"
          (ngSubmit)="submitLogin()"
          class="auth-form"
        >
          <div>
            <h2>{{ 'b2c.auth.login.title' | translate }}</h2>
            <p>
              {{ 'b2c.auth.login.descriptionPrefix' | translate }}
              {{ destinationLabel() }}.
            </p>
          </div>

          <input
            type="email"
            formControlName="email"
            [placeholder]="'b2c.auth.form.email' | translate"
          />
          <input
            type="password"
            formControlName="password"
            [placeholder]="'b2c.auth.form.password' | translate"
          />

          @if (authError()) {
          <p class="error-text">{{ authError() }}</p>
          }

          <button
            type="submit"
            class="primary-button"
            [disabled]="isSubmitting()"
          >
            {{ 'b2c.auth.actions.login' | translate }}
          </button>
        </form>
        } @else {
        <form
          [formGroup]="registerForm"
          (ngSubmit)="submitRegister()"
          class="auth-form"
        >
          <div>
            <h2>{{ 'b2c.auth.register.title' | translate }}</h2>
            <p>{{ 'b2c.auth.register.description' | translate }}</p>
          </div>

          <input
            type="text"
            formControlName="username"
            [placeholder]="'b2c.auth.form.name' | translate"
          />
          <input
            type="email"
            formControlName="email"
            [placeholder]="'b2c.auth.form.email' | translate"
          />
          <input
            type="password"
            formControlName="password"
            [placeholder]="'b2c.auth.form.password' | translate"
          />

          @if (authError()) {
          <p class="error-text">{{ authError() }}</p>
          }

          <button
            type="submit"
            class="primary-button"
            [disabled]="isSubmitting()"
          >
            {{ 'b2c.auth.actions.createAccount' | translate }}
          </button>
        </form>
        } }
      </article>
    </section>
  `,
  styles: [
    `
      .auth-layout {
        display: grid;
        grid-template-columns: minmax(0, 1.1fr) minmax(320px, 440px);
        gap: 1.5rem;
      }
      .intro-card,
      .auth-card {
        border-radius: 28px;
        border: 1px solid rgba(42, 34, 20, 0.08);
        background: rgba(255, 255, 255, 0.88);
        padding: 1.6rem;
        box-shadow: 0 24px 60px rgba(76, 46, 20, 0.08);
      }
      .intro-card {
        background: linear-gradient(
          145deg,
          rgba(255, 248, 239, 0.96),
          rgba(255, 233, 205, 0.88)
        );
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
      h1 {
        font-size: clamp(2rem, 4vw, 3.4rem);
        line-height: 1.02;
        margin-bottom: 1rem;
      }
      .intro-copy,
      .auth-form p,
      .signed-in-card p {
        color: #5b4f42;
        line-height: 1.7;
      }
      .feature-list {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 0.85rem;
        margin-top: 1.5rem;
      }
      .feature-list div {
        display: flex;
        flex-direction: column;
        padding: 1rem;
        border-radius: 20px;
        background: rgba(255, 255, 255, 0.85);
        border: 1px solid rgba(42, 34, 20, 0.08);
      }
      .feature-list strong {
        font-size: 1.45rem;
      }
      .feature-list span {
        margin-top: 0.3rem;
        color: #7f6b57;
      }
      .support-links,
      .auth-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        margin-top: 1.5rem;
      }
      .support-links a,
      .secondary-link,
      .primary-button,
      .toggle-row button {
        text-decoration: none;
        border: 0;
        cursor: pointer;
        font: inherit;
      }
      .support-links a,
      .secondary-link {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0.9rem 1.15rem;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.92);
        color: #20160d;
      }
      .auth-card {
        display: grid;
        align-content: start;
      }
      .toggle-row {
        display: inline-flex;
        gap: 0.5rem;
        margin-bottom: 1.25rem;
        padding: 0.3rem;
        border-radius: 999px;
        background: #fff4e6;
      }
      .toggle-row button {
        padding: 0.7rem 1rem;
        border-radius: 999px;
        background: transparent;
      }
      .toggle-row button.active {
        background: #c2561a;
        color: white;
      }
      .auth-form,
      .signed-in-card {
        display: grid;
        gap: 0.9rem;
      }
      input {
        width: 100%;
        border: 1px solid rgba(42, 34, 20, 0.12);
        border-radius: 16px;
        padding: 0.95rem 1rem;
        background: white;
      }
      .primary-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0.95rem 1.2rem;
        border-radius: 999px;
        background: #c2561a;
        color: white;
      }
      .error-text {
        margin: 0;
        color: #9f1c1c;
      }
      @media (max-width: 900px) {
        .auth-layout {
          grid-template-columns: 1fr;
        }
      }
      @media (max-width: 640px) {
        .feature-list {
          grid-template-columns: 1fr;
        }

        .support-links,
        .auth-actions {
          flex-direction: column;
        }
      }
    `,
  ],
})
export class AuthPageComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly cartStore = inject(CartStore);
  private readonly translationService = inject(TranslationService);

  readonly authMode = signal<'login' | 'register'>('login');
  readonly isSubmitting = signal(false);
  readonly authError = signal<string | null>(null);
  readonly cartCount = computed(() => this.cartStore.totalItems());

  readonly loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  readonly registerForm = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  ngOnInit(): void {
    const requestedMode = this.route.snapshot.queryParamMap.get('mode');
    if (requestedMode === 'register') {
      this.authMode.set('register');
    }

    this.syncSeo();
  }

  setMode(mode: 'login' | 'register'): void {
    this.authMode.set(mode);
    this.authError.set(null);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { mode },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
    this.syncSeo();
  }

  submitLogin(): void {
    if (this.loginForm.invalid || this.isSubmitting()) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.authError.set(null);
    this.isSubmitting.set(true);
    this.auth.login(this.loginForm.getRawValue()).subscribe({
      next: () => this.handleSuccess(),
      error: (error) => {
        this.authError.set(
          error?.error?.message ?? this.t('b2c.auth.errors.login')
        );
        this.isSubmitting.set(false);
      },
    });
  }

  submitRegister(): void {
    if (this.registerForm.invalid || this.isSubmitting()) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const formValue = this.registerForm.getRawValue();
    this.authError.set(null);
    this.isSubmitting.set(true);
    this.auth
      .register({
        email: formValue.email,
        password: formValue.password,
        username: formValue.username,
      })
      .subscribe({
        next: () => this.handleSuccess(),
        error: (error) => {
          this.authError.set(
            error?.error?.message ?? this.t('b2c.auth.errors.register')
          );
          this.isSubmitting.set(false);
        },
      });
  }

  continue(): void {
    void this.router.navigateByUrl(this.destinationPath());
  }

  destinationLabel(): string {
    return this.destinationPath() === '/cart'
      ? this.t('b2c.auth.destination.cart')
      : this.t('b2c.auth.destination.storefront');
  }

  private handleSuccess(): void {
    this.isSubmitting.set(false);
    void this.router.navigateByUrl(this.destinationPath());
  }

  private destinationPath(): string {
    return (
      this.route.snapshot.queryParamMap.get('returnUrl') ??
      (this.cartCount() > 0 ? '/cart' : '/')
    );
  }

  private syncSeo(): void {
    const isRegister = this.authMode() === 'register';
    this.title.setTitle(
      isRegister
        ? this.t('b2c.auth.meta.registerTitle')
        : this.t('b2c.auth.meta.loginTitle')
    );
    this.meta.updateTag({
      name: 'description',
      content: isRegister
        ? this.t('b2c.auth.meta.registerDescription')
        : this.t('b2c.auth.meta.loginDescription'),
    });
  }

  private t(key: string): string {
    return this.translationService.translate(key);
  }
}
