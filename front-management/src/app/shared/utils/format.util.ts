/**
 * Format number with Vietnamese locale (thousand separators)
 */
export function formatNumberVN(value: number): string {
  return value.toLocaleString('vi-VN');
}

/**
 * Format currency with Vietnamese locale
 */
export function formatCurrencyVN(value: number): string {
  return `${value.toLocaleString('vi-VN')} ₫`;
}
