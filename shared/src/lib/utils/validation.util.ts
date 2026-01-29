/**
 * Validation utilities for form inputs
 * @description Common validation functions used across the application
 */

/**
 * Email validation regex pattern
 * Matches standard email format: user@domain.tld
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Vietnamese phone number regex pattern
 * Matches: 0xxxxxxxxx (10 digits starting with 0)
 * Also supports formatted: 0123-456-789 or 0123 456 789
 */
const PHONE_REGEX_VN = /^0\d{9}$/;

/**
 * Korean phone number regex pattern
 * Matches: 01xxxxxxxxx (10-11 digits starting with 01)
 */
const PHONE_REGEX_KR = /^01\d{8,9}$/;

/**
 * General phone number regex (digits only, 9-15 chars)
 */
const PHONE_REGEX_GENERAL = /^\d{9,15}$/;

/**
 * Tax code / Business registration number regex (Vietnam)
 * Matches: 10 or 13 digits
 */
const TAX_CODE_REGEX_VN = /^\d{10}(\d{3})?$/;

/**
 * Validate email address
 * @param email - Email string to validate
 * @returns true if valid email format
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  return EMAIL_REGEX.test(email.trim());
}

/**
 * Validate Vietnamese phone number
 * @param phone - Phone number string (with or without dashes/spaces)
 * @returns true if valid Vietnamese phone format
 */
export function isValidPhoneVN(phone: string): boolean {
  if (!phone || typeof phone !== 'string') return false;
  const cleaned = phone.replace(/[-\s]/g, '');
  return PHONE_REGEX_VN.test(cleaned);
}

/**
 * Validate Korean phone number
 * @param phone - Phone number string (with or without dashes/spaces)
 * @returns true if valid Korean phone format
 */
export function isValidPhoneKR(phone: string): boolean {
  if (!phone || typeof phone !== 'string') return false;
  const cleaned = phone.replace(/[-\s]/g, '');
  return PHONE_REGEX_KR.test(cleaned);
}

/**
 * Validate phone number (general - any country)
 * @param phone - Phone number string
 * @returns true if valid phone format (9-15 digits)
 */
export function isValidPhone(phone: string): boolean {
  if (!phone || typeof phone !== 'string') return false;
  const cleaned = phone.replace(/[-\s]/g, '');
  return PHONE_REGEX_GENERAL.test(cleaned);
}

/**
 * Validate Vietnamese tax code / business registration number
 * @param taxCode - Tax code string
 * @returns true if valid tax code format (10 or 13 digits)
 */
export function isValidTaxCodeVN(taxCode: string): boolean {
  if (!taxCode || typeof taxCode !== 'string') return false;
  const cleaned = taxCode.replace(/[-\s]/g, '');
  return TAX_CODE_REGEX_VN.test(cleaned);
}

/**
 * Check if string is empty or whitespace only
 * @param value - String to check
 * @returns true if empty or whitespace only
 */
export function isEmpty(value: string | null | undefined): boolean {
  return !value || value.trim() === '';
}

/**
 * Check if string is not empty
 * @param value - String to check
 * @returns true if has content
 */
export function isNotEmpty(value: string | null | undefined): boolean {
  return !isEmpty(value);
}

/**
 * Validate minimum length
 * @param value - String to check
 * @param minLength - Minimum required length
 * @returns true if length >= minLength
 */
export function hasMinLength(value: string, minLength: number): boolean {
  if (!value || typeof value !== 'string') return false;
  return value.trim().length >= minLength;
}

/**
 * Validate maximum length
 * @param value - String to check
 * @param maxLength - Maximum allowed length
 * @returns true if length <= maxLength
 */
export function hasMaxLength(value: string, maxLength: number): boolean {
  if (!value || typeof value !== 'string') return true;
  return value.trim().length <= maxLength;
}

/**
 * Validate file size
 * @param file - File to validate
 * @param maxSizeMB - Maximum size in megabytes
 * @returns true if file size is within limit
 */
export function isValidFileSize(file: File | null, maxSizeMB: number): boolean {
  if (!file) return false;
  return file.size <= maxSizeMB * 1024 * 1024;
}

/**
 * Validate file type
 * @param file - File to validate
 * @param allowedTypes - Array of allowed MIME types (e.g., ['image/jpeg', 'image/png'])
 * @returns true if file type is allowed
 */
export function isValidFileType(
  file: File | null,
  allowedTypes: string[]
): boolean {
  if (!file) return false;
  return allowedTypes.some((type) => {
    if (type.endsWith('/*')) {
      // Handle wildcard types like 'image/*'
      const baseType = type.replace('/*', '');
      return file.type.startsWith(baseType);
    }
    return file.type === type;
  });
}

/**
 * Validate image file
 * @param file - File to validate
 * @returns true if file is an image
 */
export function isImageFile(file: File | null): boolean {
  return isValidFileType(file, ['image/*']);
}

/**
 * Format Vietnamese phone number
 * @param phone - Raw phone number
 * @returns Formatted phone: 0123-456-7890
 */
export function formatPhoneVN(phone: string): string {
  const value = phone.replace(/\D/g, '');

  if (value.length <= 4) {
    return value;
  } else if (value.length <= 7) {
    return value.replace(/(\d{4})(\d{1,3})/, '$1-$2');
  } else {
    return value.replace(/(\d{4})(\d{3})(\d{1,4})/, '$1-$2-$3');
  }
}

/**
 * Clean phone number (remove all non-digits)
 * @param phone - Phone number with formatting
 * @returns Clean digits only
 */
export function cleanPhoneNumber(phone: string): string {
  return phone.replace(/\D/g, '');
}
