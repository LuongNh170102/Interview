import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'landing',
  },
  {
    path: 'auth/login',
    loadComponent: () =>
      import('./public/pages/auth/login/login.component').then(
        (m) => m.LoginComponent
      ),
  },
  {
    path: 'auth/register',
    loadComponent: () =>
      import('./public/pages/auth/register/register.component').then(
        (m) => m.RegisterComponent
      ),
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
      import('./public/layout/layout.component').then((m) => m.LayoutComponent),
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
