const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const usdCents = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const int = new Intl.NumberFormat('en-US');
const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });

export const formatUsd = (n: number) => usd.format(n);
export const formatUsdCents = (n: number) => usdCents.format(n);
export const formatInt = (n: number) => int.format(n);
export const formatCompact = (n: number) => compact.format(n);
export const formatPct = (n: number) => `${(n * 100).toFixed(2)}%`;
export const ctr = (clicks: number, impressions: number) => (impressions ? clicks / impressions : 0);

export const todayISO = () => new Date().toISOString().slice(0, 10);
export const addDaysISO = (iso: string, days: number) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};
export const formatShortDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
