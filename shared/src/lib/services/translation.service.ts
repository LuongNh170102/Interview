import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, of } from 'rxjs';
import { LocalizedString } from '../interfaces/localized-string.interface';

@Injectable({
  providedIn: 'root',
})
export class TranslationService {
  private currentLang = signal<string>('vi');
  private translations = signal<Record<string, any>>({});

  constructor(private http: HttpClient) {
    this.loadTranslations(this.currentLang());
  }

  setLanguage(lang: string) {
    this.currentLang.set(lang);
    this.loadTranslations(lang);
  }

  getLanguage() {
    return this.currentLang();
  }

  private loadTranslations(lang: string) {
    this.http
      .get<Record<string, any>>(`assets/i18n/${lang}.json`)
      .pipe(
        catchError((err) => {
          console.error(`Could not load translations for ${lang}`, err);
          return of({});
        })
      )
      .subscribe((data) => {
        this.translations.set(data);
      });
  }

  translate(key: string): string {
    const keys = key.split('.');
    let value: any = this.translations();

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return key; // Return key if not found
      }
    }

    return typeof value === 'string' ? value : key;
  }

  getLocalizedValue(
    value: LocalizedString | string | null | undefined,
    fallback = 'en'
  ): string {
    if (!value) return '';
    if (typeof value === 'string') return value;

    const currentLang = this.currentLang();

    // 1. Try current language
    if (value[currentLang]) {
      return value[currentLang]!;
    }

    // 2. Try fallback language
    if (value[fallback]) {
      return value[fallback]!;
    }

    // 3. Return first available value
    const keys = Object.keys(value);
    if (keys.length > 0) {
      return value[keys[0]]!;
    }

    return '';
  }

  // Expose signal for pipe to react
  get translationsSignal() {
    return this.translations;
  }
}
