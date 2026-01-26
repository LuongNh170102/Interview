import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  HostListener,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  TranslatePipe,
  getFromStorage,
  saveToStorage,
  STORAGE_KEYS,
} from '@vhandelivery/shared-ui';

export interface ColumnVisibilityItem {
  key: string;
  labelKey: string;
  visible: boolean;
}

export interface ColumnVisibilityChangeEvent {
  key: string;
  visible: boolean;
  allColumns: ColumnVisibilityItem[];
}

/** Validator for hidden column keys array */
const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

@Component({
  selector: 'app-column-visibility-dropdown',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './column-visibility-dropdown.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColumnVisibilityDropdownComponent {
  private readonly elementRef = inject(ElementRef);

  // Inputs
  readonly columns = input.required<ColumnVisibilityItem[]>();
  readonly storageKey = input<string>('');
  readonly buttonLabel = input<string>('common.column.title');
  readonly variant = input<'primary' | 'outline'>('primary');
  readonly position = input<'left' | 'right'>('right');
  readonly size = input<'sm' | 'md'>('md');

  // Outputs
  readonly visibilityChange = output<ColumnVisibilityChangeEvent>();
  readonly columnsChange = output<ColumnVisibilityItem[]>();

  // Internal state
  readonly isOpen = signal(false);
  private readonly internalColumns = signal<ColumnVisibilityItem[]>([]);
  private isInitialized = false;

  constructor() {
    // Sync internal columns with input
    effect(() => {
      const cols = this.columns();
      untracked(() => {
        if (!this.isInitialized) {
          this.loadFromStorage(cols);
          this.isInitialized = true;
        } else {
          this.internalColumns.set(cols);
        }
      });
    });

    // Persist to localStorage when columns change
    effect(() => {
      const key = this.storageKey();
      const cols = this.internalColumns();

      if (this.isInitialized && key) {
        untracked(() => {
          const hiddenKeys = cols.filter((c) => !c.visible).map((c) => c.key);
          saveToStorage(
            `${STORAGE_KEYS.TABLE_COLUMN_VISIBILITY_PREFIX}${key}`,
            hiddenKeys
          );
        });
      }
    });
  }

  private loadFromStorage(initialColumns: ColumnVisibilityItem[]): void {
    const key = this.storageKey();
    if (!key) {
      this.internalColumns.set(initialColumns);
      return;
    }

    const savedHiddenKeys = getFromStorage<string[]>(
      `${STORAGE_KEYS.TABLE_COLUMN_VISIBILITY_PREFIX}${key}`,
      { defaultValue: [], validator: isStringArray }
    );

    const validKeys = new Set(initialColumns.map((c) => c.key));
    const validHiddenKeys = new Set(
      savedHiddenKeys.filter((k) => validKeys.has(k))
    );

    const mergedColumns = initialColumns.map((col) => ({
      ...col,
      visible: !validHiddenKeys.has(col.key),
    }));

    this.internalColumns.set(mergedColumns);
    this.columnsChange.emit(mergedColumns);
  }

  // Computed values
  readonly displayColumns = computed(() => this.internalColumns());

  readonly visibleCount = computed(
    () => this.internalColumns().filter((col) => col.visible).length
  );

  readonly totalCount = computed(() => this.internalColumns().length);

  readonly buttonClasses = computed(() => {
    const base = 'flex items-center gap-2 rounded-lg text-sm transition-colors';
    const sizeClasses = this.size() === 'sm' ? 'px-3 py-2' : 'px-4 py-2.5';

    const variantClasses =
      this.variant() === 'primary'
        ? 'bg-surface-base border border-primary text-primary hover:bg-primary-light'
        : 'border border-border text-content-secondary hover:bg-surface-muted';

    return `${base} ${sizeClasses} ${variantClasses}`;
  });

  readonly dropdownClasses = computed(() => {
    const base =
      'absolute top-full mt-2 w-64 bg-surface border border-border rounded-lg shadow-lg z-50 p-4';
    return this.position() === 'left' ? `${base} left-0` : `${base} right-0`;
  });

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
  }

  toggle(event: Event): void {
    event.stopPropagation();
    this.isOpen.update((v) => !v);
  }

  close(): void {
    this.isOpen.set(false);
  }

  onToggleColumn(key: string): void {
    this.internalColumns.update((cols) => {
      // Prevent hiding all columns
      const visibleCount = cols.filter((c) => c.visible).length;
      const column = cols.find((c) => c.key === key);

      if (column?.visible && visibleCount <= 1) {
        return cols; // Don't allow hiding last visible column
      }

      const updated = cols.map((c) =>
        c.key === key ? { ...c, visible: !c.visible } : c
      );

      this.columnsChange.emit(updated);
      const changedCol = updated.find((c) => c.key === key)!;
      this.visibilityChange.emit({
        key,
        visible: changedCol.visible,
        allColumns: updated,
      });

      return updated;
    });
  }

  onShowAll(): void {
    this.internalColumns.update((cols) => {
      const updated = cols.map((c) => ({ ...c, visible: true }));
      this.columnsChange.emit(updated);
      return updated;
    });
  }

  onHideAll(): void {
    this.internalColumns.update((cols) => {
      // Keep first column visible
      const updated = cols.map((c, i) => ({ ...c, visible: i === 0 }));
      this.columnsChange.emit(updated);
      return updated;
    });
  }

  onReset(): void {
    const initial = this.columns();
    this.internalColumns.set(initial.map((c) => ({ ...c, visible: true })));
    this.columnsChange.emit(this.internalColumns());
  }
}
