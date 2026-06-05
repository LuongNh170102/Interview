import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { AuthService, TranslationService } from '@vhandelivery/shared-ui';
import { CartStore } from './cart.store';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            currentUser: signal(null),
            logout: () => ({ subscribe: () => undefined }),
          },
        },
        {
          provide: CartStore,
          useValue: {
            totalItems: signal(0),
          },
        },
        {
          provide: TranslationService,
          useValue: {
            ensureCurrentLanguageLoaded: () => undefined,
            translate: (key: string) => key,
          },
        },
      ],
    }).compileComponents();
  });

  it('creates the storefront shell', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });
});
