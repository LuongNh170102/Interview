/**
 * DataTable Interfaces
 * Shared interfaces for reusable data table component
 */

/**
 * Column definition for DataTable
 */
export interface TableColumn<T = unknown> {
  /** Unique key for the column, matches property name in data object */
  key: string;

  /** Translation key for column header (e.g., 'admin.table.name') */
  labelKey: string;

  /** Column width (e.g., '200px', '20%', 'auto') */
  width?: string;

  /** Minimum column width (e.g., '100px') */
  minWidth?: string;

  /** Whether this column is sortable */
  sortable?: boolean;

  /** Text alignment */
  align?: 'left' | 'center' | 'right';

  /** Whether to prevent text wrapping in header and cells */
  nowrap?: boolean;

  /** Column type for special rendering */
  type?: 'text' | 'number' | 'date' | 'status' | 'avatar' | 'custom';

  /** Custom template name for 'custom' type */
  templateRef?: string;

  /** Status badge configuration for 'status' type */
  statusConfig?: Record<string, StatusConfig>;

  /** Date format for 'date' type (default: 'dd/MM/yyyy') */
  dateFormat?: string;

  /** Whether this column is visible */
  visible?: boolean;

  /** Custom CSS class for the column */
  cssClass?: string;

  /** Nested property path (e.g., 'user.profile.name') */
  nestedKey?: string;

  /** Custom value formatter */
  formatter?: (value: unknown, row: T) => string;
}

/**
 * Status badge configuration
 */
export interface StatusConfig {
  /** Translation key for status label */
  labelKey: string;

  /** Badge color variant */
  variant: 'success' | 'warning' | 'error' | 'info' | 'default';

  /** Icon name (optional) */
  icon?: string;
}

/**
 * Action button for table rows
 */
export interface TableAction<T = unknown> {
  /** Unique action identifier */
  id: string;

  /** Translation key for tooltip/aria-label */
  labelKey: string;

  /** Icon type (using heroicons) */
  icon: 'view' | 'edit' | 'delete' | 'download' | 'copy' | 'more' | 'custom';

  /** Custom SVG for 'custom' icon type */
  customIcon?: string;

  /** Button variant */
  variant?: 'default' | 'primary' | 'danger' | 'success';

  /** Condition to show/hide action */
  visible?: (row: T) => boolean;

  /** Condition to enable/disable action */
  disabled?: (row: T) => boolean;

  /** Confirm dialog config before action */
  confirm?: {
    titleKey: string;
    messageKey: string;
    confirmButtonKey?: string;
    cancelButtonKey?: string;
  };
}

/**
 * Table configuration
 */
export interface TableConfig<T = unknown> {
  /** Unique table identifier */
  id: string;

  /** Column definitions */
  columns: TableColumn<T>[];

  /** Row actions */
  actions?: TableAction<T>[];

  /** Enable row selection (checkbox) */
  selectable?: boolean;

  /** Enable multi-row selection */
  multiSelect?: boolean;

  /** Row identifier key (default: 'id') */
  rowIdKey?: string;

  /** Enable row click */
  clickable?: boolean;

  /** Enable hover effect */
  hoverable?: boolean;

  /** Striped rows */
  striped?: boolean;

  /** Compact mode (smaller padding) */
  compact?: boolean;

  /** Show loading skeleton */
  loading?: boolean;

  /** Empty state config */
  emptyState?: {
    iconKey?: string;
    titleKey: string;
    descriptionKey?: string;
    actionKey?: string;
  };

  /** Sticky header */
  stickyHeader?: boolean;

  /** Max height for scrollable table */
  maxHeight?: string;
}

/**
 * Sort state
 */
export interface TableSort {
  /** Column key to sort by */
  key: string;

  /** Sort direction */
  direction: 'asc' | 'desc';
}

/**
 * Pagination state
 */
export interface TablePagination {
  /** Current page (1-indexed) */
  page: number;

  /** Items per page */
  pageSize: number;

  /** Total items count */
  total: number;

  /** Available page size options */
  pageSizeOptions?: number[];
}

/**
 * Table state for external control
 */
export interface TableState {
  /** Current sort */
  sort?: TableSort;

  /** Current pagination */
  pagination: TablePagination;

  /** Selected row IDs */
  selectedIds?: string[];

  /** Search query */
  searchQuery?: string;
}

/**
 * Action event emitted when user clicks action button
 */
export interface TableActionEvent<T = unknown> {
  /** Action identifier */
  actionId: string;

  /** Row data */
  row: T;

  /** Row index */
  index: number;
}

/**
 * Selection change event
 */
export interface TableSelectionEvent<T = unknown> {
  /** Selected rows */
  selected: T[];

  /** Selected row IDs */
  selectedIds: string[];
}

/**
 * Page change event
 */
export interface TablePageEvent {
  /** New page number (1-indexed) */
  page: number;

  /** Page size */
  pageSize: number;

  /** Previous page */
  previousPage: number;
}

/**
 * Sort change event
 */
export interface TableSortEvent {
  /** Column key */
  key: string;

  /** Sort direction */
  direction: 'asc' | 'desc';
}

/**
 * Table Header Action Button Configuration
 */
export interface TableHeaderAction {
  /** Unique action identifier */
  id: string;

  /** Translation key for button label */
  labelKey: string;

  /** Icon path (e.g., 'assets/icons/icon-plus.svg') */
  icon?: string;

  /** Button variant */
  variant: 'primary' | 'secondary' | 'outline';

  /** Show on mobile */
  showOnMobile?: boolean;

  /** Show on desktop */
  showOnDesktop?: boolean;

  /** Flex grow on mobile (for primary actions) */
  mobileFlexGrow?: boolean;
}

/**
 * Table Header Filter Configuration
 */
export interface TableHeaderFilter {
  /** Unique filter identifier */
  id: string;

  /** Translation key for filter label */
  labelKey: string;

  /** Icon path */
  icon?: string;

  /** Filter type */
  type: 'dropdown' | 'button';
}

/**
 * Table Header Configuration
 * Configures the header section above the data table
 */
export interface TableHeaderConfig {
  /** Show header section */
  show: boolean;

  /** Title configuration */
  title?: {
    /** Translation key for title */
    labelKey: string;

    /** Show item count badge */
    showCount?: boolean;
  };

  /** Search configuration */
  search?: {
    /** Enable search */
    enabled: boolean;

    /** Translation key for placeholder */
    placeholderKey: string;

    /** Minimum width (e.g., '23.75rem') */
    minWidth?: string;
  };

  /** Filter buttons */
  filters?: TableHeaderFilter[];

  /** Action buttons (add, export, etc.) */
  actions?: TableHeaderAction[];
}

/**
 * Table Header Events
 */
export interface TableHeaderSearchEvent {
  /** Search query string */
  query: string;
}

export interface TableHeaderFilterEvent {
  /** Filter identifier */
  filterId: string;

  /** Filter value */
  value: unknown;
}

export interface TableHeaderActionEvent {
  /** Action identifier */
  actionId: string;
}
