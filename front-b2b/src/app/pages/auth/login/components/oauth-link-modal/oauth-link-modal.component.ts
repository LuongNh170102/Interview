import {
  Component,
  signal,
  input,
  output,
  inject,
  ChangeDetectionStrategy,
  OnInit,
  DestroyRef,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { TranslatePipe, TranslationService } from '@vhandelivery/shared-ui';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export type OAuthProvider = 'google' | 'kakao';

export interface OAuthLinkingData {
  email: string;
  providerId: string; // googleId or kakaoId
  displayName: string;
  avatarUrl: string;
  provider: OAuthProvider;
}

@Component({
  selector: 'app-oauth-link-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './oauth-link-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OAuthLinkModalComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly translationService = inject(TranslationService);

  // Inputs
  readonly isOpen = input.required<boolean>();
  readonly oauthData = input.required<OAuthLinkingData | null>();
  readonly isLoading = input<boolean>(false);
  readonly error = input<string | null>(null);

  // Outputs
  readonly closeModal = output<void>();
  readonly submitForm = output<{ password: string }>();

  // State
  readonly passwordVisible = signal(false);
  readonly formInvalid = signal(true);

  // Computed: Provider display name (Google, Kakao)
  readonly providerDisplayName = computed(() => {
    const provider = this.oauthData()?.provider;
    return provider === 'kakao'
      ? 'Kakao'
      : provider === 'google'
      ? 'Google'
      : 'OAuth';
  });

  // Computed: Link account title based on provider
  readonly linkAccountTitle = computed(() => {
    const provider = this.oauthData()?.provider;
    if (provider === 'kakao') {
      return this.translationService.translate('auth.kakao.linkAccount');
    }
    return this.translationService.translate('auth.google.linkAccount');
  });

  // Computed: Link description based on provider
  readonly linkDescription = computed(() => {
    const provider = this.oauthData()?.provider;
    if (provider === 'kakao') {
      return this.translationService.translate('auth.kakao.linkDescription');
    }
    return this.translationService.translate('auth.google.linkDescription');
  });

  // Computed: Link button text based on provider
  readonly linkButtonText = computed(() => {
    return this.translationService.translate('auth.google.linkButton');
  });

  // Form
  readonly linkingForm: FormGroup = this.fb.group({
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  ngOnInit(): void {
    // Track form validity changes
    this.linkingForm.statusChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.formInvalid.set(this.linkingForm.invalid);
      });
  }

  // Use getter to check disabled state - more reliable with OnPush
  get isSubmitDisabled(): boolean {
    return this.formInvalid() || this.isLoading();
  }

  togglePasswordVisibility(): void {
    this.passwordVisible.update((v) => !v);
  }

  onClose(): void {
    this.linkingForm.reset();
    this.passwordVisible.set(false);
    this.closeModal.emit();
  }

  onSubmit(): void {
    if (this.linkingForm.valid && !this.isLoading()) {
      const password = this.linkingForm.value.password;
      this.submitForm.emit({ password });
    }
  }

  onBackdropClick(): void {
    this.onClose();
  }

  onModalClick(event: Event): void {
    event.stopPropagation();
  }
}
