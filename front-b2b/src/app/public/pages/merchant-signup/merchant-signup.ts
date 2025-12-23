import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomSelectComponent } from '../../shared/custom-select.component';
import { MerchantService } from '../../services/merchant.service';
import { TranslatePipe } from '@deliveryk/shared-ui';

@Component({
  selector: 'app-merchant-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, CustomSelectComponent, TranslatePipe],
  templateUrl: './merchant-signup.html',
  styleUrls: ['./merchant-signup.scss'],
})
export class MerchantSignup {
  otpRequested = false;
  otpVerified = false;
  otpCode = '';
  otpError = '';
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
  cities = [
    // main
    { value: 'hanoi', label: 'CITIES.hanoi' },
    { value: 'hcm', label: 'CITIES.hcm' },
    { value: 'danang', label: 'CITIES.danang' },
    { value: 'haiphong', label: 'CITIES.haiphong' },
    { value: 'cantho', label: 'CITIES.cantho' },
    // north
    { value: 'bacninh', label: 'CITIES.bacninh' },
    { value: 'thainguyen', label: 'CITIES.thainguyen' },
    { value: 'vinhphuc', label: 'CITIES.vinhphuc' },
    { value: 'quangninh', label: 'CITIES.quangninh' },
    { value: 'haiduong', label: 'CITIES.haiduong' },
    { value: 'namdinh', label: 'CITIES.namdinh' },
    { value: 'thaibinh', label: 'CITIES.thaibinh' },
    // center
    { value: 'hue', label: 'CITIES.hue' },
    { value: 'quangnam', label: 'CITIES.quangnam' },
    { value: 'quangngai', label: 'CITIES.quangngai' },
    { value: 'binhdinh', label: 'CITIES.binhdinh' },
    { value: 'khanhhoa', label: 'CITIES.khanhhoa' },
    { value: 'phuyen', label: 'CITIES.phuyen' },
    { value: 'nghean', label: 'CITIES.nghean' },
    { value: 'hatinh', label: 'CITIES.hatinh' },
    // south
    { value: 'binhduong', label: 'CITIES.binhduong' },
    { value: 'dongnai', label: 'CITIES.dongnai' },
    { value: 'longan', label: 'CITIES.longan' },
    { value: 'tayninh', label: 'CITIES.tayninh' },
    { value: 'bariavungtau', label: 'CITIES.bariavungtau' },
    { value: 'tiengiang', label: 'CITIES.tiengiang' },
    { value: 'vinhlong', label: 'CITIES.vinhlong' },
    { value: 'angiang', label: 'CITIES.angiang' },
    { value: 'kiengiang', label: 'CITIES.kiengiang' },
    { value: 'soctrang', label: 'CITIES.soctrang' },
    { value: 'baclieu', label: 'CITIES.baclieu' },
    { value: 'camau', label: 'CITIES.camau' },
  ];

  businessLicenses = [
    { value: 'HAS_LICENSE', label: 'LICENSES.HAS_LICENSE' },
    { value: 'NO_LICENSE', label: 'LICENSES.NO_LICENSE' },
    { value: 'PENDING_LICENSE', label: 'LICENSES.PENDING_LICENSE' },
  ];


  constructor(private merchantService: MerchantService) {}

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
    let value = input.value.replace(/\D/g, '');

    // Format: 0123-456-7890
    if (value.length <= 4) {
      this.formData.phoneNumber = value;
    } else if (value.length <= 7) {
      this.formData.phoneNumber = value.replace(/(\d{4})(\d{1,3})/, '$1-$2');
    } else {
      this.formData.phoneNumber = value.replace(/(\d{4})(\d{3})(\d{1,4})/, '$1-$2-$3');
    }
  }

  /**
   * Form validation
   */
  validateForm(): boolean {
    // all field touched
    Object.keys(this.touched).forEach(key => {
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
      'businessLicense'
    ];

    return requiredFields.every(field => {
      const value = this.formData[field];
      return value && value.toString().trim() !== '';
    });
  }

  requestOtp() {
    const phone = this.formData.phoneNumber.replace(/-/g, '');

    this.merchantService.requestOtp(phone).subscribe({
      next: () => {
        this.otpRequested = true;
      },
      error: () => {
        this.otpError = 'Không thể gửi mã OTP';
      }
    });
  }
  verifyOtp() {
    const phone = this.formData.phoneNumber.replace(/-/g, '');

    this.merchantService.verifyOtp(phone, this.otpCode).subscribe({
      next: (res) => {
        this.otpVerified = true;
        this.verificationToken = res.verificationToken;
        this.otpError = '';
      },
      error: () => {
        this.otpError = 'Mã OTP không hợp lệ hoặc đã hết hạn';
      }
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

    if (!this.otpVerified || !this.verificationToken) {
      alert('Vui lòng xác thực OTP trước');
      return;
    }
    

    const payload = {
      name: this.formData.storeName,
      address: this.formData.storeAddress,
      city: this.formData.city,
      contactName: this.formData.contactName,
      businessType: this.formData.shopType,
      businessCategory: this.formData.businessCategory,
      referralSource: this.formData.knowReason,
      hasBusinessLicense: this.formData.businessLicense === 'HAS_LICENSE',
      phone: this.formData.phoneNumber.replace(/-/g, ''),
      verificationToken: this.verificationToken, 
      socialLinks: this.formData.socialLinks || null,
    };

    // Login Authentication Token Temporary Hardcoding
    const access_token='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjIsInVzZXJuYW1lIjoienhjdkB6eGN2LmNvbSIsInJvbGVzIjpbIkNVU1RPTUVSIl0sImlhdCI6MTc2NjM2NzI3NiwiZXhwIjoxNzY2MzY4MTc2fQ.1TSg2X_sXnbvQaz6PTSHPvAbxX2RjBOExsiLeaMynyo';
    this.merchantService.registerMerchant(payload, access_token).subscribe({
      next: (res) => {
        console.log('merchant register success !', res);
        alert('success');
      },
      error: (err) => {
        console.error('merchant register failed ..', err);
      },
    });

  }
}