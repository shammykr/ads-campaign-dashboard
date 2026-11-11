import express from 'express';
import {
  AGE_RANGES, DEVICES, INTERESTS, LOCATIONS,
  buildCampaign, buildSpendSeries, mulberry32, parseISODate, withMetrics,
} from './data.js';

const PORT = Number(process.env.PORT ?? 4000);
const COUNT = Number(process.env.CAMPAIGN_COUNT ?? 200);
const LATENCY_MS = Number(process.env.API_LATENCY_MS ?? 150);
const STATUSES = ['draft', 'active', 'paused', 'ended'];

const rand = mulberry32(42);
/** @type {Map<string, {raw: any, series: any[]}>} */
const db = new Map();
for (let i = 0; i < COUNT; i++) {
  const raw = buildCampaign(i, rand);
  db.set(raw.id, { raw, series: buildSpendSeries(raw, raw.seed) });
}
let nextId = COUNT + 1;

const view = ({ raw, series }) => withMetrics(raw, series);

const app = express();
app.use(express.json());
// Simulate network latency so loading states are visible.
app.use((_req, _res, next) => setTimeout(next, LATENCY_MS));

app.get('/api/health', (_req, res) => res.json({ ok: true, campaigns: db.size }));

app.get('/api/campaigns', (_req, res) => {
  res.json([...db.values()].map(view));
});

app.get('/api/campaigns/:id/spend', (req, res) => {
  const entry = db.get(req.params.id);
  if (!entry) return res.status(404).json({ error: 'Campaign not found' });
  const { from, to } = req.query;
  const series = entry.series.filter(
    (p) => (!from || p.date >= from) && (!to || p.date <= to),
  );
  res.json(series);
});

function validateCampaign(body) {
  const errors = {};
  if (typeof body.name !== 'string' || body.name.trim().length < 3) errors.name = 'Name must be at least 3 characters';
  if (!(Number(body.budget) >= 100)) errors.budget = 'Budget must be at least $100';
  const s = parseISODate(body.startDate);
  const e = parseISODate(body.endDate);
  if (Number.isNaN(s)) errors.startDate = 'Start date is required';
  if (Number.isNaN(e)) errors.endDate = 'End date is required';
  else if (!Number.isNaN(s) && e < s) errors.endDate = 'End date must be on or after start date';
  const t = body.targeting ?? {};
  if (!Array.isArray(t.locations) || !t.locations.length || !t.locations.every((l) => LOCATIONS.includes(l))) errors.locations = 'Pick at least one location';
  if (!Array.isArray(t.devices) || !t.devices.length || !t.devices.every((d) => DEVICES.includes(d))) errors.devices = 'Pick at least one device';
  if (!AGE_RANGES.includes(t.ageRange)) errors.ageRange = 'Pick an age range';
  if (t.interests && !t.interests.every((x) => INTERESTS.includes(x))) errors.interests = 'Unknown interest';
  return errors;
}

app.post('/api/campaigns', (req, res) => {
  const errors = validateCampaign(req.body ?? {});
  if (Object.keys(errors).length) return res.status(400).json({ errors });
  const { name, budget, startDate, endDate, targeting } = req.body;
  const raw = {
    id: `cmp_${String(nextId++).padStart(4, '0')}`,
    name: name.trim(),
    status: 'draft',
    budget: Number(budget),
    startDate, endDate,
    targeting: { interests: [], ...targeting },
    cpm: 6, ctr: 0.01, seed: nextId,
  };
  const entry = { raw, series: [] };
  db.set(raw.id, entry);
  res.status(201).json(view(entry));
});

app.patch('/api/campaigns/:id', (req, res) => {
  const entry = db.get(req.params.id);
  if (!entry) return res.status(404).json({ error: 'Campaign not found' });
  const { budget, status } = req.body ?? {};
  if (budget !== undefined) {
    if (!(Number(budget) >= 100)) return res.status(400).json({ errors: { budget: 'Budget must be at least $100' } });
    entry.raw.budget = Number(budget);
  }
  if (status !== undefined) {
    if (!STATUSES.includes(status)) return res.status(400).json({ errors: { status: 'Invalid status' } });
    entry.raw.status = status;
  }
  res.json(view(entry));
});

app.listen(PORT, () => {
  console.log(`Mock API listening on http://localhost:${PORT} (${db.size} campaigns)`);
});
