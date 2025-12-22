import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslationService } from '../services/translation.service';
import { LocalizedString } from '../interfaces/localized-string.interface';

@Pipe({
  name: 'localizedText',
  standalone: true,
  pure: false,
})
export class LocalizedTextPipe implements PipeTransform {
  private readonly translationService = inject(TranslationService);

  transform(
    value: LocalizedString | string | null | undefined,
    fallback = 'en'
  ): string {
    return this.translationService.getLocalizedValue(value, fallback);
  }
}
