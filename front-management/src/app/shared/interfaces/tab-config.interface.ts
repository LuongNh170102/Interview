export interface TabConfig {
  link: string;
  labelKey: string;
  /** Required permission to view this tab (format: 'resource:action') */
  permission: string;
}
