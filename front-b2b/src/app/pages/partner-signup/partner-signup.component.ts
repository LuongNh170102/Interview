import { Component, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CustomSelectComponent } from '../../shared/components/custom-select/custom-select.component';
import { GlobalModalComponent } from '../../shared/components/global-modal/global-modal.component';
import { OtpModalComponent } from '../../shared/components/otp-modal/otp-modal.component';
import {
  TranslatePipe,
  VerifyOtpResponse,
  AgencyService,
  CreateAgencyRequest,
  isValidEmail,
  isImageFile,
  isValidFileSize,
  formatPhoneVN,
  cleanPhoneNumber,
} from '@vhandelivery/shared-ui';
import { CITIES } from '../../shared/constants/form-options.constant';
import { BackButtonComponent } from '../../shared/components/back-button/back-button.component';
import { ModalType } from '../../shared/types/modal-type.type';
import { RegistrationStateService } from '../../shared/services/registration-state.service';

@Component({
  selector: 'app-partner-signup',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CustomSelectComponent,
    TranslatePipe,
    GlobalModalComponent,
    OtpModalComponent,
    BackButtonComponent,
  ],
  templateUrl: './partner-signup.component.html',
  styleUrls: ['./partner-signup.component.scss'],
})
export class PartnerSignupComponent {
  // Modal states
  showOtpModal = false;

  modalConfig = {
    isOpen: false,
    type: 'info' as ModalType,
    title: '',
    message: '',
  };

  otpVerified = false;
  verificationToken: string | null = null;

  // Form data
  formData = {
    companyName: '',
    responsiblePerson: '',
    phoneNumber: '',
    email: '',
    businessRegistrationNumber: '',
    businessRegistrationNumber2: '',
    storeAddress: '',
    city: '',
    businessLicenseImage: null as File | null,
  };

  // Image preview
  imagePreview: string | null = null;

  // Touched fields
  touched = {
    companyName: false,
    responsiblePerson: false,
    phoneNumber: false,
    email: false,
    businessRegistrationNumber: false,
    storeAddress: false,
    city: false,
    businessLicenseImage: false,
  };

  // Cities
  cities = CITIES;

  @ViewChild(OtpModalComponent) otpModal!: OtpModalComponent;

  private readonly agencyService = inject(AgencyService);
  private readonly router = inject(Router);
  private readonly registrationState = inject(RegistrationStateService);

  /**
   * Field error check
   */
  hasError(fieldName: keyof typeof this.formData): boolean {
    const field = fieldName as keyof typeof this.touched;
    if (!this.touched[field]) return false;

    if (fieldName === 'email') {
      return !this.formData.email || !isValidEmail(this.formData.email);
    }

    if (fieldName === 'businessLicenseImage') {
      return !this.formData.businessLicenseImage;
    }

    const value = this.formData[fieldName];
    return !value || (typeof value === 'string' && value.trim() === '');
  }

  /**
   * Field blur events (when lose focus)
   */
  onBlur(fieldName: keyof typeof this.touched): void {
    this.touched[fieldName] = true;
  }

  /**
   * Phone format
   */
  formatPhoneNumber(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.formData.phoneNumber = formatPhoneVN(input.value);
  }

  /**
   * Handle image upload
   */
  onImageSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];

      // Validate file type
      if (!isImageFile(file)) {
        this.showModal(
          'error',
          'modal.error',
          'partnerSignup.form.invalidImageType'
        );
        return;
      }

      // Validate file size (max 5MB)
      if (!isValidFileSize(file, 5)) {
        this.showModal(
          'error',
          'modal.error',
          'partnerSignup.form.imageTooLarge'
        );
        return;
      }

      this.formData.businessLicenseImage = file;
      this.touched.businessLicenseImage = true;

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  /**
   * Remove uploaded image
   */
  removeImage(): void {
    this.formData.businessLicenseImage = null;
    this.imagePreview = null;
  }

  /**
   * Trigger file input click
   */
  triggerFileInput(): void {
    const fileInput = document.getElementById(
      'businessLicenseImage'
    ) as HTMLInputElement;
    fileInput?.click();
  }

  /**
   * Form validation
   */
  validateForm(): boolean {
    // Mark all fields as touched
    Object.keys(this.touched).forEach((key) => {
      this.touched[key as keyof typeof this.touched] = true;
    });

    // Check required fields
    const requiredFields: (keyof typeof this.formData)[] = [
      'companyName',
      'responsiblePerson',
      'phoneNumber',
      'email',
      'businessRegistrationNumber',
      'storeAddress',
      'city',
      'businessLicenseImage',
    ];

    const isValid = requiredFields.every((field) => {
      if (field === 'businessLicenseImage') {
        return !!this.formData.businessLicenseImage;
      }
      if (field === 'email') {
        return this.formData.email && isValidEmail(this.formData.email);
      }
      const value = this.formData[field];
      return value && (typeof value === 'string' ? value.trim() !== '' : true);
    });

    return isValid;
  }

  showModal(type: ModalType, title: string, message: string) {
    this.modalConfig = {
      isOpen: true,
      type,
      title,
      message,
    };
  }

  closeModal() {
    this.modalConfig.isOpen = false;
  }

  requestOtp() {
    const phone = cleanPhoneNumber(this.formData.phoneNumber);

    this.agencyService.requestOtp(phone).subscribe({
      next: () => {
        this.showOtpModal = true;
        // Start countdown in modal
        setTimeout(() => this.otpModal?.startCountdown(), 0);
      },
      error: () => {
        this.showModal('error', 'modal.error', 'modal.registrationFailedDesc');
      },
    });
  }

  onOtpVerify(code: string) {
    const phone = cleanPhoneNumber(this.formData.phoneNumber);

    this.agencyService.verifyOtp(phone, code).subscribe({
      next: (res: VerifyOtpResponse) => {
        this.otpVerified = true;
        this.verificationToken = res.verificationToken;
        this.showOtpModal = false;
        this.otpModal?.resetVerifying();
        this.submitRegistration();
      },
      error: () => {
        this.otpModal?.resetVerifying();
        this.showModal('error', 'modal.error', 'modal.otpInvalid');
      },
    });
  }

  onOtpResend() {
    this.requestOtp();
  }

  submitRegistration() {
    const createAgencyRequest: CreateAgencyRequest = {
      name: this.formData.companyName,
      phone: cleanPhoneNumber(this.formData.phoneNumber),
      verificationToken: this.verificationToken ?? '',
      taxCode: this.formData.businessRegistrationNumber,
      email: this.formData.email,
      address: `${this.formData.storeAddress}, ${this.formData.city}`,
    };

    this.agencyService.create(createAgencyRequest).subscribe({
      next: () => {
        this.registrationState.markAsCompleted('partner');
        this.router.navigate(['/registration-success']);
      },
      error: (err: unknown) => {
        console.error('Partner register failed..', err);
        this.showModal(
          'error',
          'modal.registrationFailed',
          'modal.registrationFailedDesc'
        );
      },
    });
  }

  /**
   * Form submit
   */
  onSubmit(event: Event): void {
    event.preventDefault();

    if (!this.validateForm()) {
      console.error('Form validation failed');
      // Scroll to first error
      const firstError = document.querySelector('.form-hint.error');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // If not verified, request OTP first
    if (!this.otpVerified) {
      this.requestOtp();
      return;
    }

    this.submitRegistration();
  }
}
