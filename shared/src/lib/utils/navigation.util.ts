export function sanitizeReturnUrl(
  returnUrl: string | null | undefined,
  fallback = '/'
): string {
  if (!returnUrl?.trim()) {
    return fallback;
  }

  const value = returnUrl.trim();

  if (value.startsWith('//') || value.includes('://')) {
    return fallback;
  }

  if (!value.startsWith('/')) {
    return fallback;
  }

  if (value.startsWith('//')) {
    return fallback;
  }

  return value;
}
