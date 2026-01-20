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
  { labelKey: 'header.nav.partner', link: '/landing#' },
  { labelKey: 'header.nav.intro', link: '/landing#intro' },
  { labelKey: 'header.nav.offers', link: '/landing#offers' },
  { labelKey: 'header.nav.process', link: '/landing#process' },
  { labelKey: 'header.nav.news', link: '/landing#news' },
] as const;
