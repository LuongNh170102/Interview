import { Route } from '@angular/router';
export const appRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./public/layout/layout')
        .then(m => m.LayoutComponent),
    children: [
      {
        path: 'merchant-signup',
        loadComponent: () =>
          import('./public/pages/merchant-signup/merchant-signup')
            .then(m => m.MerchantSignup),
      },
    ],
  },
];