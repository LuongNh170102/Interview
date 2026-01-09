export interface MenuItem {
  label: string;
  route?: string;
  children?: MenuItem[];
}

export interface NavItem {
  readonly labelKey: string;
  readonly link: string;
  readonly active?: boolean;
}

/**
 * Navigation items for landing page sections
 * These items will navigate to landing page with fragment anchors
 */
export const LANDING_NAV_CONFIG: readonly NavItem[] = [
  { labelKey: 'HEADER.NAV.PARTNER', link: '/landing#' },
  { labelKey: 'HEADER.NAV.INTRO', link: '/landing#intro' },
  { labelKey: 'HEADER.NAV.OFFERS', link: '/landing#offers' },
  { labelKey: 'HEADER.NAV.PROCESS', link: '/landing#process' },
  { labelKey: 'HEADER.NAV.NEWS', link: '/landing#news' },
] as const;
