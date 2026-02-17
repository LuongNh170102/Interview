import { LocalizedString } from './localized-string.interface';

export interface SelectOption {
  value: string;
  label: string | LocalizedString; // Translation key, plain text, or LocalizedString
  disabled?: boolean; // Optional disabled state
}
