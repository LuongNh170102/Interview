import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'landing',
  },
  {
    path: 'landing',
    loadComponent: () =>
      import('./public/pages/landing/landing.component').then(
        (m) => m.LandingComponent
      ),
  },
  {
    path: '',
    loadComponent: () =>
      import('./public/layout/layout').then((m) => m.LayoutComponent),
    children: [
      {
        path: 'merchant-signup',
        loadComponent: () =>
          import(
            './public/pages/merchant-signup/merchant-signup.component'
          ).then((m) => m.MerchantSignup),
      },
    ],
  },
];
