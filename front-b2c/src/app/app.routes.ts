import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'products',
    loadComponent: () =>
      import('./pages/product-list/product-list.component').then(
        (m) => m.ProductListComponent
      ),
    title: 'Sản phẩm - VHan Delivery',
  },
  {
    path: 'products/:externalId',
    loadComponent: () =>
      import('./pages/product-detail/product-detail.component').then(
        (m) => m.ProductDetailComponent
      ),
    title: 'Chi tiết sản phẩm',
  },
  {
    path: 'cart',
    loadComponent: () =>
      import('./pages/cart/cart.component').then((m) => m.CartComponent),
    title: 'Giỏ hàng',
  },
  {
    path: 'checkout',
    loadComponent: () =>
      import('./pages/checkout/checkout.component').then(
        (m) => m.CheckoutComponent
      ),
    title: 'Thanh toán - VHan Delivery',
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full',
  },
];
