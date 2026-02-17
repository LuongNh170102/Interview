import { Component, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CustomSelectComponent } from '../../shared/components/custom-select/custom-select.component';
import { GlobalModalComponent } from '../../shared/components/global-modal/global-modal.component';
import { OtpModalComponent } from '../../shared/components/otp-modal/otp-modal.component';
import {
  TranslatePipe,
  RegisterMerchantRequest,
  MerchantService,
  formatPhoneVN,
  cleanPhoneNumber,
} from '@vhandelivery/shared-ui';
import {
  CITIES,
  BUSINESS_LICENSES,
} from '../../shared/constants/form-options.constant';
import { BackButtonComponent } from '../../shared/components/back-button/back-button.component';
import { ModalType } from '../../shared/types/modal-type.type';
import { RegistrationStateService } from '../../shared/services/registration-state.service';

@Component({
  selector: 'app-merchant-signup',
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
  templateUrl: './merchant-signup.component.html',
  styleUrls: ['./merchant-signup.component.scss'],
})
export class MerchantSignup {
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
    storeName: '',
    city: '',
    storeAddress: '',
    businessCategory: '',
    contactName: '',
    phoneNumber: '',
    knowReason: '',
    shopType: 'online',
    businessLicense: '',
    socialLinks: '',
  };

  // Touched fields
  touched = {
    storeName: false,
    city: false,
    storeAddress: false,
    businessCategory: false,
    contactName: false,
    phoneNumber: false,
    knowReason: false,
    businessLicense: false,
  };

  // Cities
  cities = CITIES;

  businessLicenses = BUSINESS_LICENSES;

  @ViewChild(OtpModalComponent) otpModal!: OtpModalComponent;

  private readonly merchantService = inject(MerchantService);
  private readonly router = inject(Router);
  private readonly registrationState = inject(RegistrationStateService);

  /**
   * field error check
   */
  hasError(fieldName: keyof typeof this.formData): boolean {
    const field = fieldName as keyof typeof this.touched;
    return this.touched[field] && !this.formData[fieldName];
  }

  /**
   * field blur events (when lose focus)
   */
  onBlur(fieldName: keyof typeof this.touched): void {
    this.touched[fieldName] = true;
  }

  /**
   * chane shop type
   */
  onShopTypeChange(type: 'online' | 'offline'): void {
    this.formData.shopType = type;
  }

  /**
   * phone format
   */
  formatPhoneNumber(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.formData.phoneNumber = formatPhoneVN(input.value);
  }

  /**
   * Form validation
   */
  validateForm(): boolean {
    // all field touched
    Object.keys(this.touched).forEach((key) => {
      this.touched[key as keyof typeof this.touched] = true;
    });

    // check must field
    const requiredFields: (keyof typeof this.formData)[] = [
      'storeName',
      'city',
      'storeAddress',
      'businessCategory',
      'contactName',
      'phoneNumber',
      'knowReason',
      'businessLicense',
    ];

    return requiredFields.every((field) => {
      const value = this.formData[field];
      return value && value.toString().trim() !== '';
    });
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

    this.merchantService.requestOtp(phone).subscribe({
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

    this.merchantService.verifyOtp(phone, code).subscribe({
      next: (res) => {
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
    const payload: RegisterMerchantRequest = {
      name: this.formData.storeName,
      address: this.formData.storeAddress,
      city: this.formData.city,
      contactName: this.formData.contactName,
      businessType: this.formData.shopType as any,
      businessCategory: this.formData.businessCategory,
      referralSource: this.formData.knowReason,
      hasBusinessLicense: this.formData.businessLicense === 'HAS_LICENSE',
      phone: cleanPhoneNumber(this.formData.phoneNumber),
      verificationToken: this.verificationToken!,
      socialLinks: this.formData.socialLinks || undefined,
    };

    // Login Authentication Token Temporary Hardcoding

    this.merchantService.register(payload).subscribe({
      next: () => {
        this.registrationState.markAsCompleted('merchant');
        this.router.navigate(['/registration-success']);
      },
      error: (err) => {
        console.error('merchant register failed ..', err);
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
      // go scroll to first err
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

    // If already verified (rare case if they closed modal but somehow verified), submit directly
    this.submitRegistration();
  }
}
