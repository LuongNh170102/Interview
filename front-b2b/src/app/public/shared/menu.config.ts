export interface MenuItem {
  label: string;
  route?: string;
  children?: MenuItem[];
}

export const MENU_CONFIG: MenuItem[] = [
  {
    label: 'MENU.VHAN_DELIVERY',
    children: [
      { label: 'MENU.SUB_MENU_1', route: '#' },
      { label: 'MENU.SUB_MENU_2', route: '#' },
      { label: 'MENU.SUB_MENU_3', route: '#' },
    ],
  },
  {
    label: 'MENU.MERCHANT_SIGNUP',
    route: '/merchant-signup',
  },
];
