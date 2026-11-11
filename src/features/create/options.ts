// Targeting options – must stay in sync with server/data.js.
export const LOCATIONS = [
  { value: 'US', label: 'United States' }, { value: 'CA', label: 'Canada' }, { value: 'GB', label: 'United Kingdom' },
  { value: 'DE', label: 'Germany' }, { value: 'FR', label: 'France' }, { value: 'IN', label: 'India' },
  { value: 'JP', label: 'Japan' }, { value: 'AU', label: 'Australia' }, { value: 'BR', label: 'Brazil' },
  { value: 'MX', label: 'Mexico' },
];
export const DEVICES = [
  { value: 'desktop', label: 'Desktop' }, { value: 'mobile', label: 'Mobile' },
  { value: 'tablet', label: 'Tablet' }, { value: 'ctv', label: 'Connected TV' },
];
export const AGE_RANGES = ['18-24', '25-34', '35-44', '45-54', '55+'].map((v) => ({ value: v, label: v }));
export const INTERESTS = ['sports', 'travel', 'tech', 'fashion', 'finance', 'food', 'gaming', 'parenting', 'auto', 'health'].map(
  (v) => ({ value: v, label: v[0].toUpperCase() + v.slice(1) }),
);

export const labelFor = (opts: { value: string; label: string }[], v: string) => opts.find((o) => o.value === v)?.label ?? v;
