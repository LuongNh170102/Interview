import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  computed,
  signal,
  TemplateRef,
  ContentChildren,
  QueryList,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { TranslatePipe } from '@vhandelivery/shared-ui';

/**
 * Directive to define custom cell templates
 */
import { Directive, inject, Input } from '@angular/core';
import {
  StatusConfig,
  TableActionEvent,
  TableColumn,
  TableConfig,
  TableHeaderActionEvent,
  TableHeaderConfig,
  TableHeaderFilterEvent,
  TableHeaderSearchEvent,
  TablePageEvent,
  TablePagination,
  TableSelectionEvent,
  TableSort,
  TableSortEvent,
} from '../../interfaces/table.interface';

@Directive({
  selector: '[appTableCell]',
  standalone: true,
})
export class TableCellDirective {
  @Input('appTableCell') columnKey!: string;
  readonly templateRef = inject(TemplateRef<unknown>);
}

/**
 * Reusable DataTable Component
 *
 * Features:
 * - Generic type support
 * - Configurable columns with multiple types
 * - Sorting, pagination
 * - Row actions (view, edit, delete, etc.)
 * - Row selection (single/multi)
 * - Custom cell templates
 * - Accessibility (keyboard nav, ARIA)
 * - Tailwind CSS styling with CSS variables
 *
 * @example
 * ```html
 * <app-data-table
 *   [config]="tableConfig"
 *   [data]="merchants()"
 *   [pagination]="paginationState()"
 *   (actionClick)="onAction($event)"
 *   (pageChange)="onPageChange($event)"
 *   (sortChange)="onSortChange($event)"
 * >
 *   <ng-template appTableCell="customColumn" let-row let-value="value">
 *     <span class="custom">{{ value }}</span>
 *   </ng-template>
 * </app-data-table>
 * ```
 */
@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, TranslatePipe, DatePipe, TableCellDirective],
  templateUrl: './data-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataTableComponent<
  T extends Record<string, unknown> = Record<string, unknown>
> {
  // Math reference for template
  readonly Math = Math;

  // Inputs
  readonly config = input.required<TableConfig<T>>();
  readonly data = input<T[]>([]);
  readonly pagination = input<TablePagination | null>(null);
  readonly currentSort = input<TableSort | null>(null);
  readonly selectedIds = input<string[]>([]);
  readonly loading = input<boolean>(false);
  readonly headerConfig = input<TableHeaderConfig | null>(null);
  readonly itemCount = input<number | null>(null);

  // Outputs
  readonly actionClick = output<TableActionEvent<T>>();
  readonly rowClick = output<{ row: T; index: number }>();
  readonly selectionChange = output<TableSelectionEvent<T>>();
  readonly pageChange = output<TablePageEvent>();
  readonly sortChange = output<TableSortEvent>();
  readonly headerSearch = output<TableHeaderSearchEvent>();
  readonly headerFilter = output<TableHeaderFilterEvent>();
  readonly headerAction = output<TableHeaderActionEvent>();

  // Content children for custom templates
  @ContentChildren(TableCellDirective)
  cellTemplates!: QueryList<TableCellDirective>;

  // Internal state
  private readonly internalSelectedIds = signal<Set<string>>(new Set());
  private readonly internalSort = signal<TableSort | null>(null);

  // Computed values
  readonly visibleColumns = computed(() => {
    const cols = this.config().columns;
    return cols.filter((col) => col.visible !== false);
  });

  readonly sortState = computed(
    () => this.currentSort() ?? this.internalSort()
  );

  readonly allSelected = computed(() => {
    const data = this.data();
    const selected = this.internalSelectedIds();
    const rowIdKey = this.config().rowIdKey ?? 'id';

    if (data.length === 0) return false;
    return data.every((row) => selected.has(String(row[rowIdKey])));
  });

  readonly someSelected = computed(() => {
    const selected = this.internalSelectedIds();
    return selected.size > 0 && !this.allSelected();
  });

  readonly totalPages = computed(() => {
    const pag = this.pagination();
    if (!pag) return 1;
    return Math.ceil(pag.total / pag.pageSize);
  });

  readonly pageNumbers = computed(() => {
    const total = this.totalPages();
    const current = this.pagination()?.page ?? 1;
    const pages: (number | 'ellipsis')[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      if (current > 3) pages.push('ellipsis');

      const start = Math.max(2, current - 1);
      const end = Math.min(total - 1, current + 1);

      for (let i = start; i <= end; i++) pages.push(i);

      if (current < total - 2) pages.push('ellipsis');
      pages.push(total);
    }

    return pages;
  });

  // Icon SVGs
  readonly icons = {
    view: `<path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />`,
    edit: `<path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />`,
    delete: `<path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />`,
    download: `<path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />`,
    copy: `<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />`,
    more: `<path stroke-linecap="round" stroke-linejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />`,
    sortAsc: `<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />`,
    sortDesc: `<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />`,
    chevronLeft: `<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />`,
    chevronRight: `<path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />`,
    empty: `<path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />`,
  };

  // Methods
  getCellValue(row: T, column: TableColumn<T>): unknown {
    const key = column.nestedKey ?? column.key;
    const keys = key.split('.');
    let value: unknown = row;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = (value as Record<string, unknown>)[k];
      } else {
        value = undefined;
        break;
      }
    }

    if (column.formatter) {
      return column.formatter(value, row);
    }

    return value;
  }

  // Helper methods for type-safe template usage
  getCellDateValue(row: T, column: TableColumn<T>): Date | string | null {
    const value = this.getCellValue(row, column);
    if (value === null || value === undefined) return null;
    if (value instanceof Date) return value;
    if (typeof value === 'string' || typeof value === 'number')
      return new Date(value);
    return null;
  }

  getCellNumberValue(row: T, column: TableColumn<T>): number | null {
    const value = this.getCellValue(row, column);
    if (value === null || value === undefined) return null;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const num = parseFloat(value);
      return isNaN(num) ? null : num;
    }
    return null;
  }

  getCellStringValue(row: T, column: TableColumn<T>): string {
    const value = this.getCellValue(row, column);
    if (value === null || value === undefined) return '';
    return String(value);
  }

  getCellTemplate(columnKey: string): TemplateRef<unknown> | null {
    if (!this.cellTemplates) return null;
    const template = this.cellTemplates.find((t) => t.columnKey === columnKey);
    return template?.templateRef ?? null;
  }

  getStatusConfig(column: TableColumn<T>, value: unknown): StatusConfig | null {
    if (!column.statusConfig || value === null || value === undefined)
      return null;
    return column.statusConfig[String(value)] ?? null;
  }

  getStatusClasses(variant: StatusConfig['variant']): string {
    const baseClasses =
      'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium';
    const variantClasses: Record<StatusConfig['variant'], string> = {
      success:
        'bg-[var(--color-avatar-green-bg)] text-[var(--color-status-success)]',
      warning:
        'bg-[var(--color-avatar-yellow-bg)] text-[var(--color-status-warning)]',
      error:
        'bg-[var(--color-avatar-orange-bg)] text-[var(--color-status-error)]',
      info: 'bg-[var(--color-avatar-cyan-bg)] text-[var(--color-status-info)]',
      default:
        'bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]',
    };
    return `${baseClasses} ${variantClasses[variant]}`;
  }

  getActionIcon(iconType: string): string {
    return this.icons[iconType as keyof typeof this.icons] ?? '';
  }

  getActionIconSrc(iconType: string): string {
    const iconMap: Record<string, string> = {
      more: 'assets/icons/icon-more.svg',
      edit: 'assets/icons/icon-modify.svg',
      delete: 'assets/icons/icon-delete.svg',
      view: 'assets/icons/icon-search.svg',
      activate: 'assets/icons/icon-activation.svg',
      deactivate: 'assets/icons/icon-deactivation.svg',
    };
    return iconMap[iconType] ?? 'assets/icons/icon-more.svg';
  }

  getActionClasses(variant?: string): string {
    const base =
      'w-8 h-8 flex items-center justify-center bg-transparent border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1';
    const variants: Record<string, string> = {
      default:
        'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-background)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] focus:ring-[var(--color-primary)]',
      primary:
        'border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white focus:ring-[var(--color-primary)]',
      danger:
        'border-red-500 text-red-500 hover:bg-red-500 hover:text-white focus:ring-red-500',
      success:
        'border-green-500 text-green-500 hover:bg-green-500 hover:text-white focus:ring-green-500',
    };
    return `${base} ${variants[variant ?? 'default']}`;
  }

  isActionVisible(action: { visible?: (row: T) => boolean }, row: T): boolean {
    if (!action.visible) return true;
    return action.visible(row);
  }

  isActionDisabled(
    action: { disabled?: (row: T) => boolean },
    row: T
  ): boolean {
    if (!action.disabled) return false;
    return action.disabled(row);
  }

  onActionClick(event: Event, actionId: string, row: T, index: number): void {
    event.stopPropagation();
    this.actionClick.emit({ actionId, row, index });
  }

  onRowClick(row: T, index: number): void {
    if (this.config().clickable) {
      this.rowClick.emit({ row, index });
    }
  }

  onRowKeydown(event: KeyboardEvent, row: T, index: number): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.onRowClick(row, index);
    }
  }

  onSort(column: TableColumn<T>): void {
    if (!column.sortable) return;

    const currentSort = this.sortState();
    let direction: 'asc' | 'desc' = 'asc';

    if (currentSort?.key === column.key) {
      direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
    }

    this.internalSort.set({ key: column.key, direction });
    this.sortChange.emit({ key: column.key, direction });
  }

  onSelectAll(event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    const rowIdKey = this.config().rowIdKey ?? 'id';
    const data = this.data();

    if (checkbox.checked) {
      const allIds = new Set(data.map((row) => String(row[rowIdKey])));
      this.internalSelectedIds.set(allIds);
      this.selectionChange.emit({
        selected: data,
        selectedIds: Array.from(allIds),
      });
    } else {
      this.internalSelectedIds.set(new Set());
      this.selectionChange.emit({ selected: [], selectedIds: [] });
    }
  }

  onSelectRow(event: Event, row: T): void {
    event.stopPropagation();
    const checkbox = event.target as HTMLInputElement;
    const rowIdKey = this.config().rowIdKey ?? 'id';
    const rowId = String(row[rowIdKey]);
    const selected = new Set(this.internalSelectedIds());

    if (checkbox.checked) {
      selected.add(rowId);
    } else {
      selected.delete(rowId);
    }

    this.internalSelectedIds.set(selected);

    const selectedRows = this.data().filter((r) =>
      selected.has(String(r[rowIdKey]))
    );
    this.selectionChange.emit({
      selected: selectedRows,
      selectedIds: Array.from(selected),
    });
  }

  isRowSelected(row: T): boolean {
    const rowIdKey = this.config().rowIdKey ?? 'id';
    const rowId = String(row[rowIdKey]);
    return (
      this.internalSelectedIds().has(rowId) ||
      this.selectedIds().includes(rowId)
    );
  }

  onPageClick(page: number | 'ellipsis'): void {
    if (page === 'ellipsis') return;

    const pag = this.pagination();
    if (!pag) return;

    this.pageChange.emit({
      page,
      pageSize: pag.pageSize,
      previousPage: pag.page,
    });
  }

  onPageChange(page: number): void {
    const pag = this.pagination();
    if (!pag) return;

    this.pageChange.emit({
      page,
      pageSize: pag.pageSize,
      previousPage: pag.page,
    });
  }

  onPrevPage(): void {
    const pag = this.pagination();
    if (!pag || pag.page <= 1) return;

    this.pageChange.emit({
      page: pag.page - 1,
      pageSize: pag.pageSize,
      previousPage: pag.page,
    });
  }

  onNextPage(): void {
    const pag = this.pagination();
    if (!pag || pag.page >= this.totalPages()) return;

    this.pageChange.emit({
      page: pag.page + 1,
      pageSize: pag.pageSize,
      previousPage: pag.page,
    });
  }

  trackByColumn(_: number, column: TableColumn<T>): string {
    return column.key;
  }

  trackByRow(index: number, row: T): string {
    const rowIdKey = this.config().rowIdKey ?? 'id';
    const id = row[rowIdKey];
    return id != null ? String(id) : String(index);
  }

  trackByAction(_: number, action: { id: string }): string {
    return action.id;
  }

  trackByPage(index: number, page: number | 'ellipsis'): string {
    return page === 'ellipsis' ? `ellipsis-${index}` : String(page);
  }

  /**
   * Determines if a page number should be hidden on mobile screens.
   * On mobile, we only show current page, first page, and last page.
   * All other pages are hidden to save space.
   */
  shouldHidePageOnMobile(pageNum: number): boolean {
    const currentPage = this.pagination()?.page ?? 1;
    const total = this.totalPages();

    // Always show current page, first page, and last page
    if (pageNum === currentPage || pageNum === 1 || pageNum === total) {
      return false;
    }

    return true;
  }

  // Header event handlers
  onHeaderSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.headerSearch.emit({ query: input.value });
  }

  onHeaderFilterClick(filterId: string): void {
    this.headerFilter.emit({ filterId, value: null });
  }

  onHeaderActionClick(actionId: string): void {
    this.headerAction.emit({ actionId });
  }
}
