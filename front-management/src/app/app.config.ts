import {
  APP_INITIALIZER,
  ApplicationConfig,
  LOCALE_ID,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { appRoutes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor, AuthService } from '@vhandelivery/shared-ui';
import { catchError, of, tap } from 'rxjs';
import { registerLocaleData } from '@angular/common';
import localeVi from '@angular/common/locales/vi';
import localeKo from '@angular/common/locales/ko';

// Register locales for date formatting
registerLocaleData(localeVi, 'vi-VN');
registerLocaleData(localeKo, 'ko-KR');

function initializeApp(auth: AuthService) {
  return () =>
    auth.refreshToken().pipe(
      tap(),
      catchError(() => of(null))
    );
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      appRoutes,
      withInMemoryScrolling({
        scrollPositionRestoration: 'top',
        anchorScrolling: 'enabled',
      })
    ),
    provideAnimations(),
    provideHttpClient(withInterceptors([authInterceptor])),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [AuthService],
      multi: true,
    },
    { provide: LOCALE_ID, useValue: 'vi-VN' },
  ],
};
