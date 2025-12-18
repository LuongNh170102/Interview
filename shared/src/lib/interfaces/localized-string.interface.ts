export interface LocalizedString {
  en: string;
  vi?: string;
  ko?: string;
  [key: string]: string | undefined;
}
