// Deterministic mock data generator. A seeded PRNG keeps the dataset stable
// across restarts while still producing realistic, randomized metrics.

const DAY_MS = 86_400_000;

export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const BRANDS = ['Acme', 'Northwind', 'Globex', 'Initech', 'Umbrella', 'Stark', 'Wayne', 'Hooli', 'Vandelay', 'Soylent'];
const PRODUCTS = ['Running Shoes', 'Smart Home', 'Coffee Subscription', 'Travel Deals', 'Fintech App', 'Streaming Plan', 'Skincare', 'Electric Bikes', 'Pet Food', 'Meal Kits'];
const OBJECTIVES = ['Awareness', 'Retargeting', 'Prospecting', 'Holiday Push', 'App Installs', 'Lead Gen'];
export const LOCATIONS = ['US', 'CA', 'GB', 'DE', 'FR', 'IN', 'JP', 'AU', 'BR', 'MX'];
export const DEVICES = ['desktop', 'mobile', 'tablet', 'ctv'];
export const INTERESTS = ['sports', 'travel', 'tech', 'fashion', 'finance', 'food', 'gaming', 'parenting', 'auto', 'health'];
export const AGE_RANGES = ['18-24', '25-34', '35-44', '45-54', '55+'];

const pick = (rand, arr) => arr[Math.floor(rand() * arr.length)];
const sample = (rand, arr, min, max) => {
  const n = min + Math.floor(rand() * (max - min + 1));
  return [...arr].sort(() => rand() - 0.5).slice(0, n);
};
export const toISODate = (ms) => new Date(ms).toISOString().slice(0, 10);
export const parseISODate = (s) => Date.parse(`${s}T00:00:00Z`);
const round2 = (n) => Math.round(n * 100) / 100;

/** Daily spend series for a campaign, from start date until min(end, today). */
export function buildSpendSeries(campaign, seed) {
  const rand = mulberry32(seed);
  const start = parseISODate(campaign.startDate);
  const end = parseISODate(campaign.endDate);
  const today = parseISODate(toISODate(Date.now()));
  const totalDays = Math.max(1, Math.round((end - start) / DAY_MS) + 1);
  const dailyTarget = campaign.budget / totalDays;
  // Each campaign has a pacing personality: under-, on- or over-pacing.
  const bias = 0.7 + rand() * 0.55;
  const last = campaign.status === 'draft' ? start - DAY_MS : Math.min(end, today);

  const series = [];
  let cumulative = 0;
  for (let t = start, i = 0; t <= last; t += DAY_MS, i++) {
    const weekday = new Date(t).getUTCDay();
    const weekendDip = weekday === 0 || weekday === 6 ? 0.8 : 1;
    const paused = campaign.status === 'paused' && t > last - 5 * DAY_MS;
    let spend = paused ? 0 : dailyTarget * bias * weekendDip * (0.75 + rand() * 0.5);
    spend = Math.min(spend, campaign.budget - cumulative);
    cumulative += spend;
    series.push({
      date: toISODate(t),
      spend: round2(spend),
      cumulativeSpend: round2(cumulative),
      idealSpend: round2(dailyTarget * (i + 1)),
    });
  }
  return series;
}

export function buildCampaign(i, rand) {
  const today = parseISODate(toISODate(Date.now()));
  const startOffset = Math.floor(rand() * 120) - 90; // -90 .. +29 days from today
  const lengthDays = 14 + Math.floor(rand() * 90);
  const start = today + startOffset * DAY_MS;
  const end = start + (lengthDays - 1) * DAY_MS;

  let status;
  if (start > today) status = 'draft';
  else if (end < today) status = 'ended';
  else status = rand() < 0.8 ? 'active' : 'paused';

  return {
    id: `cmp_${String(i + 1).padStart(4, '0')}`,
    name: `${pick(rand, BRANDS)} – ${pick(rand, PRODUCTS)} – ${pick(rand, OBJECTIVES)}`,
    status,
    budget: Math.round((2_000 + rand() * 98_000) / 100) * 100,
    startDate: toISODate(start),
    endDate: toISODate(end),
    targeting: {
      locations: sample(rand, LOCATIONS, 1, 3),
      devices: sample(rand, DEVICES, 1, 3),
      ageRange: pick(rand, AGE_RANGES),
      interests: sample(rand, INTERESTS, 0, 3),
    },
    // CPM between $2 and $14, CTR between 0.2% and 3.5%.
    cpm: 2 + rand() * 12,
    ctr: 0.002 + rand() * 0.033,
    seed: Math.floor(rand() * 2 ** 31),
  };
}

/** Recompute aggregate metrics from the spend series. */
export function withMetrics(raw, series) {
  const spend = series.length ? series[series.length - 1].cumulativeSpend : 0;
  const impressions = Math.round((spend / raw.cpm) * 1000);
  const clicks = Math.round(impressions * raw.ctr);
  const { cpm: _cpm, ctr: _ctr, seed: _seed, ...rest } = raw;
  return { ...rest, spend, impressions, clicks };
}
