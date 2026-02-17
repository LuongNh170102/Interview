import {
  Component,
  Input,
  Output,
  EventEmitter,
  forwardRef,
  HostListener,
  ElementRef,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  FormsModule,
} from '@angular/forms';
import {
  TranslatePipe,
  LocalizedTextPipe,
  SelectOption,
} from '@vhandelivery/shared-ui';

@Component({
  selector: 'app-custom-select',
  standalone: true,
  imports: [CommonModule, TranslatePipe, LocalizedTextPipe, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CustomSelectComponent),
      multi: true,
    },
  ],
  templateUrl: './custom-select.component.html',
  styleUrls: ['./custom-select.component.scss'],
})
export class CustomSelectComponent implements ControlValueAccessor, OnChanges {
  @Input() options: SelectOption[] = [];
  @Input() placeholder = 'common.select';
  @Input() disabled = false;
  @Input() searchable = false; // Enable search functionality
  @Input() searchPlaceholder = 'admin.common.search';
  @Input() clearable = false; // Enable clear button
  @Output() selectionChange = new EventEmitter<string>();

  isOpen = false;
  value = '';
  selectedOption: SelectOption | null = null;
  searchQuery = '';
  filteredOptions: SelectOption[] = [];

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private elementRef: ElementRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['options']) {
      this.filteredOptions = [...this.options];
      // Update selected option when options change
      if (this.value) {
        this.selectedOption =
          this.options.find((opt) => opt.value === this.value) || null;
      }
    }
  }

  // ControlValueAccessor implementation
  writeValue(value: string): void {
    this.value = value || '';
    this.selectedOption =
      this.options.find((opt) => opt.value === value) || null;
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  /** Type guard: is the label a translation key string? */
  isStringLabel(label: string | object): label is string {
    return typeof label === 'string';
  }

  // Toggle dropdown
  toggle(): void {
    if (!this.disabled) {
      this.isOpen = !this.isOpen;
      if (this.isOpen) {
        this.onTouched();
        this.searchQuery = '';
        this.filteredOptions = [...this.options];
      }
    }
  }

  // Select option
  selectOption(option: SelectOption): void {
    this.value = option.value;
    this.selectedOption = option;
    this.isOpen = false;
    this.searchQuery = '';
    this.filteredOptions = [...this.options];
    this.onChange(this.value);
    this.selectionChange.emit(this.value);
  }

  // Clear selection
  clearSelection(event: Event): void {
    event.stopPropagation();
    this.value = '';
    this.selectedOption = null;
    this.onChange('');
    this.selectionChange.emit('');
  }

  // Filter options based on search query
  onSearchChange(): void {
    const query = this.searchQuery.toLowerCase().trim();
    if (!query) {
      this.filteredOptions = [...this.options];
      return;
    }
    this.filteredOptions = this.options.filter((option) => {
      // Handle both string and LocalizedString labels
      const label = option.label;
      if (typeof label === 'string') {
        return label.toLowerCase().includes(query);
      }
      // LocalizedString - search in all locales
      return Object.values(label).some(
        (text) => text && text.toLowerCase().includes(query)
      );
    });
  }

  // Click outside to close
  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!this.elementRef.nativeElement.contains(target)) {
      this.isOpen = false;
      this.searchQuery = '';
      this.filteredOptions = [...this.options];
    }
  }
}
