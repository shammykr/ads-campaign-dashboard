import { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { api } from '../../api/client';
import { Button, DatePicker } from '../../components/ui';
import { useAppSelector } from '../../store';
import { selectCampaignById } from '../../store/campaignsSlice';
import type { SpendPoint } from '../../types';
import { addDaysISO, formatShortDate, formatUsd, formatUsdCents, todayISO } from '../../utils/format';
import { CumulativePacingChart, DailySpendChart } from './PacingCharts';

const Panel = styled.section`
  padding: ${({ theme }) => theme.space(5)};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(4)};
  h2 { font-size: 18px; }
  h3 { font-size: ${({ theme }) => theme.font.size.md}; margin-bottom: ${({ theme }) => theme.space(2)}; }
`;

const Controls = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  gap: ${({ theme }) => theme.space(3)};
`;

const Presets = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.space(1)};
`;

const Stats = styled.dl`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: ${({ theme }) => theme.space(3)};
  margin: 0;
  div { padding: ${({ theme }) => theme.space(3)}; background: ${({ theme }) => theme.colors.surfaceAlt}; border-radius: ${({ theme }) => theme.radius.md}; }
  dt { font-size: ${({ theme }) => theme.font.size.xs}; color: ${({ theme }) => theme.colors.textMuted}; }
  dd { margin: 0; font-size: ${({ theme }) => theme.font.size.xl}; font-weight: 600; font-variant-numeric: tabular-nums; }
`;

const Muted = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textMuted};
`;

const DataTableDetails = styled.details`
  summary { cursor: pointer; color: ${({ theme }) => theme.colors.primary}; font-weight: 500; }
  table { width: 100%; margin-top: ${({ theme }) => theme.space(2)}; border-collapse: collapse; font-variant-numeric: tabular-nums; }
  th, td { padding: 4px 8px; border-bottom: 1px solid ${({ theme }) => theme.colors.border}; text-align: right; }
  th:first-child, td:first-child { text-align: left; }
`;

type Preset = '7d' | '30d' | 'all';
const PRESETS: { key: Preset; label: string }[] = [
  { key: '7d', label: 'Last 7 days' },
  { key: '30d', label: 'Last 30 days' },
  { key: 'all', label: 'Flight to date' },
];

export function BudgetPacingPanel({ campaignId }: { campaignId: string }) {
  const campaign = useAppSelector((s) => selectCampaignById(s, campaignId));
  const [range, setRange] = useState({ from: '', to: '' });
  const [series, setSeries] = useState<SpendPoint[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  const startDate = campaign?.startDate;
  const endDate = campaign?.endDate;

  // Reset the range to the full flight whenever the selected campaign changes.
  useEffect(() => {
    setRange({ from: '', to: '' });
  }, [campaignId]);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    api
      .getSpend(campaignId, range.from || undefined, range.to || undefined)
      .then((data) => {
        if (cancelled) return;
        setSeries(data);
        setStatus('ready');
      })
      .catch(() => !cancelled && setStatus('error'));
    return () => {
      cancelled = true;
    };
  }, [campaignId, range.from, range.to]);

  const applyPreset = (p: Preset) => {
    if (p === 'all') return setRange({ from: '', to: '' });
    const to = todayISO() < (endDate ?? '') ? todayISO() : endDate ?? todayISO();
    setRange({ from: addDaysISO(to, p === '7d' ? -6 : -29), to });
  };

  const rangeError = range.from && range.to && range.from > range.to ? 'Start must be before end' : undefined;

  const summary = useMemo(() => {
    if (!campaign || !series.length) return null;
    const last = series[series.length - 1];
    const rangeSpend = series.reduce((sum, p) => sum + p.spend, 0);
    const pacing = last.idealSpend ? last.cumulativeSpend / last.idealSpend : 0;
    return { rangeSpend, pacing, remaining: campaign.budget - last.cumulativeSpend };
  }, [campaign, series]);

  if (!campaign) return null;

  const pacingLabel = summary
    ? summary.pacing > 1.1 ? 'Over-pacing' : summary.pacing < 0.9 ? 'Under-pacing' : 'On pace'
    : '';

  return (
    <Panel aria-labelledby="pacing-heading">
      <div>
        <h2 id="pacing-heading">Budget pacing</h2>
        <Muted>
          {campaign.name} · {formatShortDate(campaign.startDate)} – {formatShortDate(campaign.endDate)} · Budget {formatUsd(campaign.budget)}
        </Muted>
      </div>

      <Controls role="group" aria-label="Date range">
        <Presets>
          {PRESETS.map((p) => (
            <Button key={p.key} size="sm" variant="secondary" onClick={() => applyPreset(p.key)}>
              {p.label}
            </Button>
          ))}
        </Presets>
        <DatePicker
          label="From"
          compact
          value={range.from}
          min={startDate}
          max={endDate}
          onChange={(from) => setRange((r) => ({ ...r, from }))}
        />
        <DatePicker
          label="To"
          compact
          value={range.to}
          min={startDate}
          max={endDate}
          error={rangeError}
          onChange={(to) => setRange((r) => ({ ...r, to }))}
        />
      </Controls>

      <div aria-live="polite" aria-busy={status === 'loading'}>
        {status === 'error' && <Muted role="alert">Could not load spend data.</Muted>}
        {status !== 'error' && series.length === 0 && status === 'ready' && (
          <Muted>No spend recorded in this range{campaign.status === 'draft' ? ' — campaign has not started yet' : ''}.</Muted>
        )}
        {summary && (
          <Stats>
            <div><dt>Spend in range</dt><dd>{formatUsd(summary.rangeSpend)}</dd></div>
            <div><dt>Budget remaining</dt><dd>{formatUsd(summary.remaining)}</dd></div>
            <div><dt>Pacing vs target</dt><dd>{Math.round(summary.pacing * 100)}% · {pacingLabel}</dd></div>
          </Stats>
        )}
      </div>

      {series.length > 0 && (
        <>
          <figure style={{ margin: 0 }} aria-labelledby="cum-title">
            <h3 id="cum-title">Cumulative spend vs. even-pacing target</h3>
            <CumulativePacingChart data={series} />
          </figure>
          <figure style={{ margin: 0 }} aria-labelledby="daily-title">
            <h3 id="daily-title">Daily spend</h3>
            <DailySpendChart data={series} />
          </figure>
          <DataTableDetails>
            <summary>View pacing data as a table</summary>
            <table>
              <caption className="sr-only">Daily spend for {campaign.name}</caption>
              <thead>
                <tr><th scope="col">Date</th><th scope="col">Daily spend</th><th scope="col">Cumulative</th><th scope="col">Target</th></tr>
              </thead>
              <tbody>
                {series.map((p) => (
                  <tr key={p.date}>
                    <td>{p.date}</td>
                    <td>{formatUsdCents(p.spend)}</td>
                    <td>{formatUsdCents(p.cumulativeSpend)}</td>
                    <td>{formatUsdCents(p.idealSpend)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DataTableDetails>
        </>
      )}
    </Panel>
  );
}
