import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@vhandelivery/shared-ui';

@Component({
  selector: 'app-otp-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './otp-modal.component.html',
  styleUrls: ['./otp-modal.component.scss'],
})
export class OtpModalComponent implements AfterViewInit {
  @Input() isOpen = false;
  @Input() phoneNumber = '';
  @Output() close = new EventEmitter<void>();
  @Output() verify = new EventEmitter<string>();
  @Output() resend = new EventEmitter<void>();

  otpCode = '';
  countdown = 0;

  @ViewChild('otpInput') otpInput!: ElementRef;

  ngAfterViewInit() {
    if (this.isOpen) {
      this.focusInput();
    }
  }

  focusInput() {
    setTimeout(() => this.otpInput?.nativeElement?.focus(), 100);
  }

  onClose() {
    this.close.emit();
    this.otpCode = '';
  }

  onVerify() {
    if (this.otpCode.length === 6) {
      this.verify.emit(this.otpCode);
    }
  }

  onResend() {
    if (this.countdown === 0) {
      this.resend.emit();
      this.startCountdown();
      this.otpCode = '';
      this.focusInput();
    }
  }

  startCountdown() {
    this.countdown = 60;
    const timer = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        clearInterval(timer);
      }
    }, 1000);
  }

  onInput(event: any) {
    const input = event.target;
    input.value = input.value.replace(/[^0-9]/g, '');
    this.otpCode = input.value;

    if (this.otpCode.length === 6) {
      this.onVerify();
    }
  }

  get maskedPhone(): string {
    if (!this.phoneNumber) return '';
    // Format: +84 909 *** 888
    let cleanPhone = this.phoneNumber.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '+84' + cleanPhone.substring(1);
    }

    // If length is sufficient
    if (cleanPhone.length > 8) {
      const start = cleanPhone.substring(0, 6); // +84 90
      const end = cleanPhone.substring(cleanPhone.length - 3);
      return `${start.substring(0, 3)} ${start.substring(3)} *** ${end}`;
    }

    return this.phoneNumber;
  }
}
