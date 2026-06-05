import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/catalog/catalog.component').then(
        (m) => m.CatalogComponent
      ),
  },
  {
    path: 'auth',
    loadComponent: () =>
      import('./pages/auth/auth-page.component').then(
        (m) => m.AuthPageComponent
      ),
  },
  {
    path: 'products/:id',
    loadComponent: () =>
      import('./pages/product-detail/product-detail.component').then(
        (m) => m.ProductDetailComponent
      ),
  },
  {
    path: 'cart',
    loadComponent: () =>
      import('./pages/cart/cart-page.component').then(
        (m) => m.CartPageComponent
      ),
  },
];
