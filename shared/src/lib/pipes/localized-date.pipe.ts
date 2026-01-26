import { Pipe, PipeTransform, inject } from '@angular/core';
import { formatDate } from '@angular/common';
import { TranslationService } from '../services/translation.service';
import { DateFormatType } from '../types/date-format.type';
import {
  DATE_FORMAT_CONFIGS,
  DEFAULT_LOCALE,
} from '../constants/date-format.constant';

/**
 * Localized Date Pipe
 * Formats dates according to the current language with proper locale
 *
 * @example
 * ```html
 * {{ createdAt | localizedDate }}
 * {{ createdAt | localizedDate:'short' }}
 * {{ createdAt | localizedDate:'full' }}
 * ```
 */
@Pipe({
  name: 'localizedDate',
  standalone: true,
  pure: false,
})
export class LocalizedDatePipe implements PipeTransform {
  private readonly translationService = inject(TranslationService);

  transform(
    value: Date | string | number | null | undefined,
    format: DateFormatType | string = 'short'
  ): string {
    if (!value) return '';

    const currentLang = this.translationService.getLanguage();
    const config =
      DATE_FORMAT_CONFIGS[currentLang] ?? DATE_FORMAT_CONFIGS[DEFAULT_LOCALE];

    // Get the format pattern
    const formatPattern = config.formats[format as DateFormatType] ?? format;

    try {
      // Parse the date value
      let dateValue: Date;
      if (value instanceof Date) {
        dateValue = value;
      } else if (typeof value === 'string') {
        // Handle ISO date string or date-only string
        dateValue = new Date(value);
      } else {
        dateValue = new Date(value);
      }

      // Check if date is valid
      if (isNaN(dateValue.getTime())) {
        return String(value);
      }

      return formatDate(dateValue, formatPattern, config.locale);
    } catch (error) {
      console.error('LocalizedDatePipe error:', error);
      return String(value);
    }
  }
}
