export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace('IDR', 'Rp');
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(2)}%`;
}

export function parseCurrency(value: string): number {
  const cleaned = value.replace(/[^0-9]/g, '');
  return parseInt(cleaned) || 0;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('id-ID').format(value);
}

export function formatInputCurrency(value: string): string {
  // Remove all non-digit characters
  const cleaned = value.replace(/[^0-9]/g, '');
  if (!cleaned) return '';
  
  // Format with thousands separators
  const number = parseInt(cleaned);
  return new Intl.NumberFormat('id-ID').format(number);
}

export function stripCurrencyPrefix(formattedCurrency: string): string {
  // Handle negative values by preserving the minus sign
  const isNeg = formattedCurrency.trim().startsWith('-');
  const cleaned = formattedCurrency.replace(/^\s*-?\s*Rp[\s\u00A0]*/i, '');
  return (isNeg ? '-' : '') + cleaned.trim();
}
