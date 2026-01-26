import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@vhandelivery/shared-ui';
import { PermissionRouteData } from '../interfaces/permission.interface';

/**
 * Guard that checks if user has required permissions to access a route.
 *
 * Usage in routes:
 * ```typescript
 * {
 *   path: 'agencies',
 *   loadComponent: () => import('./agencies.component').then(m => m.AgenciesComponent),
 *   canActivate: [permissionGuard],
 *   data: { permissions: ['agency:read'] }
 * }
 * ```
 */
export const permissionGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const routeData = route.data as PermissionRouteData;
  const requiredPermissions = routeData?.permissions ?? [];
  const requireAll = routeData?.requireAll ?? false;

  if (requiredPermissions.length === 0) {
    return true;
  }

  const hasAccess = requireAll
    ? authService.hasAllPermissions(...requiredPermissions)
    : authService.hasAnyPermission(...requiredPermissions);

  if (hasAccess) {
    return true;
  }

  return router.createUrlTree(['/dashboard']);
};

/**
 * Factory function to create a permission guard with specific permissions
 * Useful for inline guard creation without route data
 *
 * Usage:
 * ```typescript
 * {
 *   path: 'agencies',
 *   canActivate: [withPermissions('agency:read')],
 * }
 * ```
 */
export const withPermissions =
  (...permissions: string[]): CanActivateFn =>
  () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.hasAnyPermission(...permissions)) {
      return true;
    }

    return router.createUrlTree(['/dashboard']);
  };

/**
 * Factory function requiring ALL permissions
 */
export const withAllPermissions =
  (...permissions: string[]): CanActivateFn =>
  () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.hasAllPermissions(...permissions)) {
      return true;
    }

    return router.createUrlTree(['/dashboard']);
  };
