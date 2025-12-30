import { Component, Input, Output, EventEmitter, forwardRef, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TranslatePipe, SelectOption } from '@vhandelivery/shared-ui';

@Component({
  selector: 'app-custom-select',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CustomSelectComponent),
      multi: true
    }
  ],
  templateUrl: './custom-select.component.html',
  styleUrls: ['./custom-select.component.scss']
})
export class CustomSelectComponent implements ControlValueAccessor {
  @Input() options: SelectOption[] = [];
  @Input() placeholder: string = '선택하세요';
  @Input() disabled: boolean = false;
  @Output() selectionChange = new EventEmitter<string>();

  isOpen = false;
  value: string = '';
  selectedOption: SelectOption | null = null;

  private onChange: (value: any) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private elementRef: ElementRef) {}

  // ControlValueAccessor 구현
  writeValue(value: string): void {
    this.value = value;
    this.selectedOption = this.options.find(opt => opt.value === value) || null;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  // 토글
  toggle(): void {
    if (!this.disabled) {
      this.isOpen = !this.isOpen;
      if (this.isOpen) {
        this.onTouched();
      }
    }
  }

  // 옵션 선택
  selectOption(option: SelectOption): void {
    this.value = option.value;
    this.selectedOption = option;
    this.isOpen = false;
    this.onChange(this.value);
    this.selectionChange.emit(this.value);
  }

  // 외부 클릭 시 닫기
  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!this.elementRef.nativeElement.contains(target)) {
      this.isOpen = false;
    }
  }
}
