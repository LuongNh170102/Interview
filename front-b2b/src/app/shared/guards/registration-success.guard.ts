import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { RegistrationStateService } from '../services/registration-state.service';

/**
 * Guard that only allows access to registration-success page
 * if user has just completed registration.
 *
 * - Checks if registration is marked as completed
 * - If completed: allows access and clears the state
 * - If not completed: redirects to register-type page
 */
export const registrationSuccessGuard: CanActivateFn = () => {
  const registrationStateService = inject(RegistrationStateService);
  const router = inject(Router);

  if (registrationStateService.isCompleted()) {
    // Allow access and clear state (one-time view)
    registrationStateService.clear();
    return true;
  }

  // Redirect to register-type if not coming from registration flow
  return router.createUrlTree(['/register-type']);
};
