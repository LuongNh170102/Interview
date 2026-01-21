import { Route } from '@angular/router';
import { authGuard } from './shared/guards/auth.guard';
import { withPermissions } from './shared/guards/permission.guard';

export const appRoutes: Route[] = [
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    loadComponent: () =>
      import('./layout/layout.component').then((m) => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent
          ),
      },
      {
        path: 'partners',
        loadComponent: () =>
          import(
            './pages/partners/partners-layout/partners-layout.component'
          ).then((m) => m.PartnersLayoutComponent),
        canActivate: [withPermissions('agency:read', 'merchant:read')],
        children: [
          {
            path: 'agencies',
            loadComponent: () =>
              import('./pages/partners/agencies/agencies.component').then(
                (m) => m.AgenciesComponent
              ),
            canActivate: [withPermissions('agency:read')],
          },
          {
            path: 'merchants',
            loadComponent: () =>
              import('./pages/partners/merchants/merchants.component').then(
                (m) => m.MerchantsComponent
              ),
            canActivate: [withPermissions('merchant:read')],
          },
        ],
      },
      {
        path: 'categories',
        loadComponent: () =>
          import('./pages/categories/categories.component').then(
            (m) => m.CategoriesComponent
          ),
        canActivate: [withPermissions('category:read')],
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./pages/orders/orders.component').then(
            (m) => m.OrdersComponent
          ),
        canActivate: [withPermissions('order:read')],
      },
      {
        path: 'reports',
        loadComponent: () =>
          import('./pages/reports/reports.component').then(
            (m) => m.ReportsComponent
          ),
        canActivate: [withPermissions('system:view_reports')],
      },
      {
        path: 'audit-logs',
        loadComponent: () =>
          import('./pages/audit-logs/audit-logs.component').then(
            (m) => m.AuditLogsComponent
          ),
        canActivate: [withPermissions('system:view_reports')],
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
