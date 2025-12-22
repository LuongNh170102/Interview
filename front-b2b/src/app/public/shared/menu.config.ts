export interface MenuItem {
  label: string;
  route?: string;
  children?: MenuItem[];
}

export const MENU_CONFIG: MenuItem[] = [
  {
    label: 'VHan Delivery',
    children: [
      { label: 'Sub Menu 1', route: '#' },
      { label: 'Sub Menu 2', route: '#' },
      { label: 'Sub Menu 3', route: '#' },
    ],
  },
  {
    label: 'Đăng ký đối tác',
    route: '/merchant-signup',
  },
];
