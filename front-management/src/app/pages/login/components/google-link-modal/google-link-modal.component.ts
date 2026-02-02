import {
  Component,
  signal,
  input,
  output,
  inject,
  ChangeDetectionStrategy,
  OnInit,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { TranslatePipe } from '@vhandelivery/shared-ui';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export interface GoogleLinkingData {
  email: string;
  googleId: string;
  displayName: string;
  avatarUrl: string;
}

@Component({
  selector: 'app-google-link-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './google-link-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GoogleLinkModalComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  // Inputs
  readonly isOpen = input.required<boolean>();
  readonly googleData = input.required<GoogleLinkingData | null>();
  readonly isLoading = input<boolean>(false);
  readonly error = input<string | null>(null);

  // Outputs
  readonly closeModal = output<void>();
  readonly submitForm = output<{ password: string }>();

  // State
  readonly passwordVisible = signal(false);
  readonly formInvalid = signal(true);

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
