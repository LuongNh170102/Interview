import {
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
} from '../constants/languages.constant';
import { PRIMITIVE_TYPES } from '../constants/common.constant';

export function toLocalizedJson(value: any): any {
  if (!value) return value;

  const result: Record<string, any> = {};

  if (typeof value === PRIMITIVE_TYPES.STRING) {
    result[DEFAULT_LANGUAGE] = value;

    return result;
  }

  // Handle object input
  let hasContent = false;
  for (const lang of SUPPORTED_LANGUAGES) {
    if (value[lang]) {
      result[lang] = value[lang];
      hasContent = true;
    }
  }

  if (!result[DEFAULT_LANGUAGE]) {
    result[DEFAULT_LANGUAGE] = value[DEFAULT_LANGUAGE] || '';
  }

  return result;
}
