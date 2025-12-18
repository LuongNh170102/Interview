import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { LocalizedString } from '../interfaces/localized-string.interface';

@Pipe({
  name: 'localizedText',
  standalone: true,
  pure: false 
})
export class LocalizedTextPipe implements PipeTransform {
  
  private readonly translateService = inject(TranslateService);

  transform(value: LocalizedString | string | null | undefined, fallback = 'en'): string {
    if (!value) return '';
    if (typeof value === 'string') return value;

    const currentLang = this.translateService.getCurrentLang() || this.translateService.getFallbackLang() || fallback;

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
}
