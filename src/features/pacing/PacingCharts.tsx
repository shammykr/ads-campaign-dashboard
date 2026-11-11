import { memo } from 'react';
import {
  Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { useTheme } from 'styled-components';
import type { SpendPoint } from '../../types';
import { formatCompact, formatShortDate, formatUsdCents } from '../../utils/format';

const money = (v: number) => `$${formatCompact(v)}`;
const tooltipMoney = (v: number) => formatUsdCents(v);

/** Cumulative spend vs. the even-pacing target line. Memoized: re-renders only when data changes. */
export const CumulativePacingChart = memo(function CumulativePacingChart({ data }: { data: SpendPoint[] }) {
  const t = useTheme();
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
        <CartesianGrid stroke={t.colors.chart.grid} vertical={false} />
        <XAxis dataKey="date" tickFormatter={formatShortDate} tick={{ fill: t.colors.chart.axis, fontSize: 12 }} minTickGap={24} />
        <YAxis tickFormatter={money} tick={{ fill: t.colors.chart.axis, fontSize: 12 }} width={56} />
        <Tooltip formatter={tooltipMoney} labelFormatter={(l) => formatShortDate(String(l))} />
        <Legend verticalAlign="top" align="right" height={28} iconType="plainline" />
        <Line
          type="monotone"
          dataKey="cumulativeSpend"
          name="Actual spend"
          stroke={t.colors.chart.actual}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
          isAnimationActive={false}
        />
        <Line
          type="linear"
          dataKey="idealSpend"
          name="Even-pacing target"
          stroke={t.colors.chart.target}
          strokeWidth={2}
          strokeDasharray="6 4"
          dot={false}
          activeDot={{ r: 4 }}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
});

/** Daily spend bars (separate chart rather than a second y-axis). */
export const DailySpendChart = memo(function DailySpendChart({ data }: { data: SpendPoint[] }) {
  const t = useTheme();
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
        <CartesianGrid stroke={t.colors.chart.grid} vertical={false} />
        <XAxis dataKey="date" tickFormatter={formatShortDate} tick={{ fill: t.colors.chart.axis, fontSize: 12 }} minTickGap={24} />
        <YAxis tickFormatter={money} tick={{ fill: t.colors.chart.axis, fontSize: 12 }} width={56} />
        <Tooltip formatter={tooltipMoney} labelFormatter={(l) => formatShortDate(String(l))} cursor={{ fill: t.colors.primarySubtle }} />
        <Bar dataKey="spend" name="Daily spend" fill={t.colors.chart.actual} radius={[4, 4, 0, 0]} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
});
