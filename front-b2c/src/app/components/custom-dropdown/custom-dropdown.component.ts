import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SelectOption } from '@vhandelivery/shared-ui';

@Component({
  selector: 'app-custom-dropdown',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './custom-dropdown.component.html',
  styleUrl: './custom-dropdown.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomDropdownComponent {
  private readonly elementRef = inject(ElementRef);

  options = input.required<SelectOption[]>();
  value = input.required<string>();
  label = input('');
  compact = input(false);
  dropUp = input(false);
  valueChange = output<string>();

  readonly isOpen = signal(false);

  readonly selectedLabel = computed(() => {
    const current = this.options().find((opt) => opt.value === this.value());
    return current?.label ?? this.options()[0]?.label ?? '';
  });

  toggle(): void {
    this.isOpen.update((open) => !open);
  }

  select(option: SelectOption): void {
    this.isOpen.set(false);
    if (option.value !== this.value()) {
      this.valueChange.emit(option.value);
    }
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target as Node)) {
      this.isOpen.set(false);
    }
  }
}
