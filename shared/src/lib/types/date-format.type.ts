/**
 * Supported date format types
 *
 * @example
 * - 'short': dd/MM/yyyy (vi) | MM/dd/yyyy (en) | yyyy.MM.dd (ko)
 * - 'medium': dd/MM/yyyy HH:mm (vi) | MMM d, yyyy (en) | yyyy년 M월 d일 (ko)
 * - 'long': dd MMMM yyyy (vi) | MMMM d, yyyy (en) | yyyy년 M월 d일 (ko)
 * - 'full': EEEE, dd MMMM yyyy (vi) | EEEE, MMMM d, yyyy (en) | yyyy년 M월 d일 EEEE (ko)
 * - 'dateTime': dd/MM/yyyy HH:mm:ss (vi) | MM/dd/yyyy h:mm a (en) | yyyy.MM.dd HH:mm (ko)
 * - 'time': HH:mm (vi/ko) | h:mm a (en)
 * - 'monthYear': MM/yyyy (vi) | MMM yyyy (en) | yyyy년 M월 (ko)
 * - 'dayMonth': dd/MM (vi) | MMM d (en) | M월 d일 (ko)
 */
export type DateFormatType =
  | 'short'
  | 'medium'
  | 'long'
  | 'full'
  | 'dateTime'
  | 'time'
  | 'monthYear'
  | 'dayMonth';
