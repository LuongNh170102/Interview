import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomSelectComponent } from '../../shared/custom-select.component';
import { MerchantService } from '../../services/merchant.service';

@Component({
  selector: 'app-merchant-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, CustomSelectComponent],
  templateUrl: './merchant-signup.html',
  styleUrls: ['./merchant-signup.css'],
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
    { value: 'hanoi', label: 'Hà Nội' },
    { value: 'hcm', label: 'TP. Hồ Chí Minh' },
    { value: 'danang', label: 'Đà Nẵng' },
    { value: 'haiphong', label: 'Hải Phòng' },
    { value: 'cantho', label: 'Cần Thơ' },
    // north
    { value: 'bacninh', label: 'Bắc Ninh' },
    { value: 'thainguyen', label: 'Thái Nguyên' },
    { value: 'vinhphuc', label: 'Vĩnh Phúc' },
    { value: 'quangninh', label: 'Quảng Ninh' },
    { value: 'haiduong', label: 'Hải Dương' },
    { value: 'namdinh', label: 'Nam Định' },
    { value: 'thaibinh', label: 'Thái Bình' },
    // center
    { value: 'hue', label: 'Thừa Thiên Huế' },
    { value: 'quangnam', label: 'Quảng Nam' },
    { value: 'quangngai', label: 'Quảng Ngãi' },
    { value: 'binhdinh', label: 'Bình Định' },
    { value: 'khanhhoa', label: 'Khánh Hòa' },
    { value: 'phuyen', label: 'Phú Yên' },
    { value: 'nghean', label: 'Nghệ An' },
    { value: 'hatinh', label: 'Hà Tĩnh' },
    // south
    { value: 'binhduong', label: 'Bình Dương' },
    { value: 'dongnai', label: 'Đồng Nai' },
    { value: 'longan', label: 'Long An' },
    { value: 'tayninh', label: 'Tây Ninh' },
    { value: 'bariavungtau', label: 'Bà Rịa - Vũng Tàu' },
    { value: 'tiengiang', label: 'Tiền Giang' },
    { value: 'vinhlong', label: 'Vĩnh Long' },
    { value: 'angiang', label: 'An Giang' },
    { value: 'kiengiang', label: 'Kiên Giang' },
    { value: 'soctrang', label: 'Sóc Trăng' },
    { value: 'baclieu', label: 'Bạc Liêu' },
    { value: 'camau', label: 'Cà Mau' },
  ];

  businessLicenses = [
    { value: 'HAS_LICENSE', label: 'Có' },
    { value: 'NO_LICENSE', label: 'Chưa có' },
    { value: 'PENDING_LICENSE', label: 'Đang chờ cấp phép' },
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