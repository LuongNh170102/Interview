import { NavItem } from './types/nav-item.type';

/**
 * Navigation items for admin management header
 * Based on Figma design: Dashboard, Đối tác & Cửa hàng, Danh mục, Đơn hàng, Báo cáo, Audit Logs
 *
 * Permissions are matched against backend Permission model format: resource:action
 * Available resources: product, category, order, merchant, agency, system
 * Available actions: create, read, update, delete, update_status, manage_users, view_reports
 */
export const ADMIN_NAV_CONFIG: readonly NavItem[] = [
  {
    labelKey: 'admin.nav.dashboard',
    link: '/dashboard',
    // Dashboard is visible to all authenticated users
  },
  {
    labelKey: 'admin.nav.partners',
    link: '/partners',
    permission: { resource: 'system', action: 'manage_users' },
  },
  {
    labelKey: 'admin.nav.categories',
    link: '/categories',
    permission: { resource: 'category', action: 'read' },
  },
  {
    labelKey: 'admin.nav.orders',
    link: '/orders',
    permission: { resource: 'order', action: 'read' },
  },
  {
    labelKey: 'admin.nav.reports',
    link: '/reports',
    permission: { resource: 'system', action: 'view_reports' },
  },
  {
    labelKey: 'admin.nav.auditLogs',
    link: '/audit-logs',
    permission: { resource: 'system', action: 'view_reports' },
  },
] as const;

/**
 * Sub-navigation for Partners page tabs
 */
export const PARTNERS_TAB_CONFIG: readonly NavItem[] = [
  {
    labelKey: 'admin.partners.tabs.agencies',
    link: '/partners/agencies',
    permission: { resource: 'system', action: 'manage_users' },
  },
  {
    labelKey: 'admin.partners.tabs.merchants',
    link: '/partners/merchants',
    permission: { resource: 'system', action: 'manage_users' },
  },
] as const;
