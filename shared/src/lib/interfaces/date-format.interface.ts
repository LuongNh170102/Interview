import { DateFormatType } from '../types/date-format.type';

/**
 * Locale-specific date configuration
 */
export interface LocaleDateConfig {
  /** Locale identifier (e.g., 'vi-VN', 'en-US', 'ko-KR') */
  locale: string;
  /** Format patterns for each date format type */
  formats: Record<DateFormatType, string>;
}
