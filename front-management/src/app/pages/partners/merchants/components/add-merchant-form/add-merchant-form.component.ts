import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  TranslatePipe,
  AgencyService,
  CategoryService,
  SelectOption,
  AdminCreateMerchantRequest,
  formatPhoneVN,
  cleanPhoneNumber,
} from '@vhandelivery/shared-ui';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CustomSelectComponent } from '../../../../../shared/components/custom-select/custom-select.component';

@Component({
  selector: 'app-add-merchant-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslatePipe,
    CustomSelectComponent,
  ],
  templateUrl: './add-merchant-form.component.html',
  styleUrl: './add-merchant-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddMerchantFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly agencyService = inject(AgencyService);
  private readonly categoryService = inject(CategoryService);

  /** Agency options for CustomSelectComponent */
  readonly agencyOptions = signal<SelectOption[]>([]);

  /** Category options for CustomSelectComponent */
  readonly categoryOptions = signal<SelectOption[]>([]);

  /** Business type options for CustomSelectComponent */
  readonly businessTypeOptions = signal<SelectOption[]>([
    { value: 'ONLINE', label: 'admin.partners.merchants.businessType.online' },
    { value: 'OFFLINE', label: 'admin.partners.merchants.businessType.offline' },
    { value: 'HYBRID', label: 'admin.partners.merchants.businessType.hybrid' },
  ]);

  /** Referral source options for CustomSelectComponent */
  readonly referralSourceOptions = signal<SelectOption[]>([
    { value: 'FACEBOOK', label: 'admin.partners.merchants.referralSource.facebook' },
    { value: 'GOOGLE', label: 'admin.partners.merchants.referralSource.google' },
    { value: 'REFERRAL', label: 'admin.partners.merchants.referralSource.referral' },
    { value: 'DIRECT', label: 'admin.partners.merchants.referralSource.direct' },
    { value: 'OTHER', label: 'admin.partners.merchants.referralSource.other' },
  ]);

  /** Emits when form is submitted successfully */
  readonly submitForm = output<AdminCreateMerchantRequest>();

  /** Emits when cancel is clicked */
  readonly cancel = output<void>();

  /** Loading state */
  readonly isLoading = signal(false);

  /** Logo preview URL */
  readonly logoPreview = signal<string | null>(null);

  /** Form group */
  readonly form: FormGroup = this.fb.group({
    // Basic Info
    name: ['', [Validators.required, Validators.minLength(2)]],
    phone: ['', [Validators.required, Validators.pattern(/^[\d\-]{10,15}$/)]],
    address: ['', [Validators.required]],
    city: ['', [Validators.required]],
    operationalStatus: ['ACTIVE', [Validators.required]],
    ownerName: ['', [Validators.required]],
    contactName: ['', [Validators.required]],
    businessType: ['', [Validators.required]],
    businessCategory: ['', [Validators.required]],
    hasBusinessLicense: [false, [Validators.required]],

    // Optional fields
    referralSource: [''],
    socialLinks: [''],
    agencyId: [''],
    brandId: [''],
    logoUrl: [''],
  });

  /** Operational status options */
  readonly operationalStatuses = signal([
    { value: 'ACTIVE', labelKey: 'common.status.active' },
    { value: 'INACTIVE', labelKey: 'common.status.inactive' },
  ]);

  ngOnInit(): void {
    this.loadAgencies();
    this.loadCategories();
  }

  /** Load agencies from API */
  private loadAgencies(): void {
    this.agencyService
      .findAll({ approvalStatus: 'APPROVED', limit: 1000 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          const options: SelectOption[] = response.data.map((agency) => ({
            value: agency.externalId,
            label: agency.name,
          }));
          this.agencyOptions.set(options);
        },
        error: (error) => {
          console.error('Failed to load agencies:', error);
        },
      });
  }

  /** Load categories from API */
  private loadCategories(): void {
    this.categoryService
      .findAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (categories) => {
          const options: SelectOption[] = categories.map((category) => ({
            value: category.externalId,
            label: category.name,
          }));
          this.categoryOptions.set(options);
        },
        error: (error) => {
          console.error('Failed to load categories:', error);
        },
      });
  }

  /** Check if form field has error */
  hasError(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return !!(field?.invalid && field?.touched);
  }

  /** Get error message for field */
  getErrorKey(fieldName: string): string {
    const field = this.form.get(fieldName);
    if (field?.hasError('required')) {
      return 'common.validation.required';
    }
    if (field?.hasError('minlength')) {
      return 'common.validation.minLength';
    }
    if (field?.hasError('pattern')) {
      return 'common.validation.invalidFormat';
    }
    return '';
  }

  /** Format phone number as user types (VN format: 0123-456-7890) */
  formatPhoneNumber(event: Event): void {
    const input = event.target as HTMLInputElement;
    const formatted = formatPhoneVN(input.value);
    this.form.patchValue({ phone: formatted }, { emitEvent: false });
    input.value = formatted;
  }

  /** Handle form submission */
  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    const formData = {
      ...this.form.value,
      phone: cleanPhoneNumber(this.form.value.phone ?? ''),
    } as AdminCreateMerchantRequest;
    this.submitForm.emit(formData);
  }

  /** Handle file selection for logo */
  onLogoSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];

      // Validate file type
      if (!file.type.startsWith('image/')) {
        console.error('Invalid file type. Please select an image.');
        return;
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        console.error('File size exceeds 5MB limit.');
        return;
      }

      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        this.logoPreview.set(result);
        this.form.patchValue({ logoUrl: result });
      };
      reader.readAsDataURL(file);
    }
  }

  /** Clear logo selection */
  clearLogo(): void {
    this.logoPreview.set(null);
    this.form.patchValue({ logoUrl: '' });
  }

  /** Handle cancel */
  onCancel(): void {
    this.cancel.emit();
  }

  /** Reset form */
  resetForm(): void {
    this.form.reset({
      operationalStatus: 'ACTIVE',
      hasBusinessLicense: false,
    });
  }
}
