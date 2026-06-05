export function parseMoney(value: unknown): number {
  if (value == null) return 0;
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  if (typeof value === 'string') return parseFloat(value) || 0;
  if (typeof value === 'object') {
    const decimal = value as Record<string, unknown>;
    if (typeof decimal['toNumber'] === 'function') {
      return (decimal['toNumber'] as () => number)();
    }
    if (Array.isArray(decimal['d'])) {
      const sign = (decimal['s'] as number) ?? 1;
      return sign * Number(decimal['d'][0] ?? 0);
    }
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function formatMoneyVN(value: unknown): string {
  return `${parseMoney(value).toLocaleString('vi-VN')} ₫`;
}
