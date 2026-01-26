import { LocaleDateConfig } from '../interfaces/date-format.interface';

/**
 * Vietnamese date formats
 */
export const VI_DATE_FORMATS: LocaleDateConfig = {
  locale: 'vi-VN',
  formats: {
    short: 'dd/MM/yyyy',
    medium: 'dd/MM/yyyy HH:mm',
    long: 'dd MMMM yyyy',
    full: 'EEEE, dd MMMM yyyy',
    dateTime: 'dd/MM/yyyy HH:mm:ss',
    time: 'HH:mm',
    monthYear: 'MM/yyyy',
    dayMonth: 'dd/MM',
  },
} as const;

/**
 * English (US) date formats
 */
export const EN_DATE_FORMATS: LocaleDateConfig = {
  locale: 'en-US',
  formats: {
    short: 'MM/dd/yyyy',
    medium: 'MMM d, yyyy',
    long: 'MMMM d, yyyy',
    full: 'EEEE, MMMM d, yyyy',
    dateTime: 'MM/dd/yyyy h:mm a',
    time: 'h:mm a',
    monthYear: 'MMM yyyy',
    dayMonth: 'MMM d',
  },
} as const;

/**
 * Korean date formats
 */
export const KO_DATE_FORMATS: LocaleDateConfig = {
  locale: 'ko-KR',
  formats: {
    short: 'yyyy.MM.dd',
    medium: 'yyyy년 M월 d일',
    long: 'yyyy년 M월 d일',
    full: 'yyyy년 M월 d일 EEEE',
    dateTime: 'yyyy.MM.dd HH:mm',
    time: 'HH:mm',
    monthYear: 'yyyy년 M월',
    dayMonth: 'M월 d일',
  },
} as const;

/**
 * All supported locale configurations
 */
export const DATE_FORMAT_CONFIGS: Record<string, LocaleDateConfig> = {
  vi: VI_DATE_FORMATS,
  en: EN_DATE_FORMATS,
  ko: KO_DATE_FORMATS,
} as const;

/**
 * Default locale fallback
 */
export const DEFAULT_LOCALE = 'vi';
