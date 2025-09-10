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
