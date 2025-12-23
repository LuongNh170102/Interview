import { Component, Input, Output, EventEmitter, forwardRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TranslatePipe } from '@deliveryk/shared-ui';

export interface SelectOption {
  value: string;
  label: string;
}

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
  template: `
    <div class="custom-select" [class.open]="isOpen" [class.disabled]="disabled">
      <div class="select-trigger" (click)="toggle()">
        <span class="select-value" [class.placeholder]="!selectedOption">
          {{ (selectedOption?.label || placeholder) | translate }}
        </span>
        <span class="select-arrow" [class.rotate]="isOpen">▼</span>
      </div>
      
      <div class="select-dropdown" *ngIf="isOpen">
        <div class="select-option" 
             *ngFor="let option of options" 
             [class.selected]="option.value === value"
             (click)="selectOption(option)">
          {{ option.label | translate }}
        </div>
      </div>
    </div>
  `,
  styles: [`
    .custom-select {
      position: relative;
      width: 100%;
    }

    .select-trigger {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 15px;
      background: white;
      border: 1px solid #ddd;
      border-radius: 5px;
      cursor: pointer;
      transition: all 0.2s ease;
      height: 17px
    }

    .select-trigger:hover {
      border-color: #999;
    }

    .custom-select.open .select-trigger {
      border-color: #E01123;
      box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.1);
    }

    .custom-select.disabled .select-trigger {
      background: #f5f5f5;
      cursor: not-allowed;
      opacity: 0.6;
    }

    .select-value {
      flex: 1;
      font-size: 14px;
      color: #333;
    }

    .select-value.placeholder {
      color: #999;
    }

    .select-arrow {
      margin-left: 8px;
      transition: transform 0.2s ease;
      font-size: 12px;
      color: #666;
    }

    .select-arrow.rotate {
      transform: rotate(180deg);
    }

    .select-dropdown {
      position: absolute;
      top: calc(100% + 4px);
      left: 0;
      right: 0;
      background: white;
      border: 1px solid #ddd;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      max-height: 240px;
      overflow-y: auto;
      z-index: 1000;
      animation: slideDown 0.2s ease;
    }

    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .select-option {
      padding: 12px 16px;
      cursor: pointer;
      transition: background 0.15s ease;
      font-size: 14px;
      color: #333;
    }

    .select-option:hover {
      background: #f5f5f5;
    }

    .select-option.selected {
      background: #eeeeeeff;
      color: #E01123;
      font-weight: 500;
    }

    /* 스크롤바 스타일 */
    .select-dropdown::-webkit-scrollbar {
      width: 4px;
    }

    .select-dropdown::-webkit-scrollbar-track {
      background: transparent;
      border-radius: 8px;
    }

    .select-dropdown::-webkit-scrollbar-thumb {
      background: #E01123;
      border-radius: 7px;
    }

    .select-dropdown::-webkit-scrollbar-thumb:hover {
      background: #999;
    }
  `]
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
    if (!target.closest('.custom-select')) {
      this.isOpen = false;
    }
  }
}