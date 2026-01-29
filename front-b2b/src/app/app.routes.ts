import { Route } from '@angular/router';
import { authGuard } from './shared/guards/auth.guard';
import { registrationSuccessGuard } from './shared/guards/registration-success.guard';

export const appRoutes: Route[] = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'landing',
  },
  {
    path: 'auth/login',
    loadComponent: () =>
      import('./pages/auth/login/login.component').then(
        (m) => m.LoginComponent
      ),
  },

  {
    path: 'auth/register',
    loadComponent: () =>
      import('./pages/auth/register/register.component').then(
        (m) => m.RegisterComponent
      ),
  },
  {
    path: 'landing',
    loadComponent: () =>
      import('./pages/landing/landing.component').then(
        (m) => m.LandingComponent
      ),
  },
  {
    path: '',
    loadComponent: () =>
      import('./layout/layout.component').then((m) => m.LayoutComponent),
    children: [
      {
        path: 'merchant-signup',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./pages/merchant-signup/merchant-signup.component').then(
            (m) => m.MerchantSignup
          ),
      },
      {
        path: 'partner-signup',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./pages/partner-signup/partner-signup.component').then(
            (m) => m.PartnerSignupComponent
          ),
      },
      {
        path: 'register-type',
        loadComponent: () =>
          import('./pages/register-type/register-type.component').then(
            (m) => m.RegisterTypeComponent
          ),
      },
      {
        path: 'registration-success',
        canActivate: [registrationSuccessGuard],
        loadComponent: () =>
          import(
            './pages/registration-success/registration-success.component'
          ).then((m) => m.RegistrationSuccessComponent),
      },
    ],
  },
];
