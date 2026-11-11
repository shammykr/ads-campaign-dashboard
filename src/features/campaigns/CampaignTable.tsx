import { createContext, memo, Profiler, useContext, useMemo } from 'react';
import styled from 'styled-components';
import { DataTable, type Column } from '../../components/ui';
import { recordRender } from '../../perf';
import { useAppSelector } from '../../store';
import { selectCampaignCount, selectFilteredCampaigns } from '../../store/campaignsSlice';
import type { Campaign } from '../../types';
import { ctr, formatInt, formatPct, formatUsd } from '../../utils/format';
import { CampaignFilters } from './CampaignFilters';
import { BudgetCell, StatusCell } from './InlineEditCells';

const NameButton = styled.button<{ $selected: boolean }>`
  max-width: 100%;
  padding: 0;
  border: 0;
  background: none;
  color: ${({ theme }) => theme.colors.primary};
  font-weight: ${({ theme, $selected }) => ($selected ? theme.font.weight.bold : theme.font.weight.medium)};
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
  text-decoration: ${({ $selected }) => ($selected ? 'underline' : 'none')};
  &:hover { text-decoration: underline; }
  &:focus-visible { outline: 3px solid ${({ theme }) => theme.colors.focus}; outline-offset: 2px; }
`;

const Id = styled.span`
  display: block;
  font-size: ${({ theme }) => theme.font.size.xs};
  color: ${({ theme }) => theme.colors.textMuted};
`;

interface Selection {
  selectedId?: string;
  onSelect: (id: string) => void;
}

// Selection is provided via context so column definitions stay stable and
// selecting a campaign re-renders only the name cells, not every row.
const SelectionContext = createContext<Selection>({ onSelect: () => {} });

const NameCell = memo(function NameCell({ campaign: c }: { campaign: Campaign }) {
  const { selectedId, onSelect } = useContext(SelectionContext);
  const selected = c.id === selectedId;
  return (
    <>
      <NameButton $selected={selected} aria-pressed={selected} onClick={() => onSelect(c.id)} title={c.name}>
        {c.name}
      </NameButton>
      <Id>{c.id}</Id>
    </>
  );
});

interface Props {
  selectedId?: string;
  onSelect: (id: string) => void;
}

const getRowId = (c: Campaign) => c.id;

export function CampaignTable({ selectedId, onSelect }: Props) {
  const campaigns = useAppSelector(selectFilteredCampaigns);
  const total = useAppSelector(selectCampaignCount);

  // Stable column definitions: memoized rows only re-render when their data changes.
  const columns = useMemo<Column<Campaign>[]>(
    () => [
      {
        key: 'name',
        header: 'Campaign',
        width: 'minmax(240px, 3fr)',
        sortValue: (c) => c.name,
        render: (c) => <NameCell campaign={c} />,
      },
      { key: 'status', header: 'Status', width: '130px', sortValue: (c) => c.status, render: (c) => <StatusCell campaign={c} /> },
      { key: 'budget', header: 'Budget', width: '140px', align: 'right', sortValue: (c) => c.budget, render: (c) => <BudgetCell campaign={c} /> },
      { key: 'spend', header: 'Spend', width: '120px', align: 'right', sortValue: (c) => c.spend, render: (c) => formatUsd(c.spend) },
      { key: 'impressions', header: 'Impressions', width: '130px', align: 'right', sortValue: (c) => c.impressions, render: (c) => formatInt(c.impressions) },
      { key: 'clicks', header: 'Clicks', width: '100px', align: 'right', sortValue: (c) => c.clicks, render: (c) => formatInt(c.clicks) },
      {
        key: 'ctr',
        header: 'CTR',
        width: '90px',
        align: 'right',
        sortValue: (c) => ctr(c.clicks, c.impressions),
        render: (c) => formatPct(ctr(c.clicks, c.impressions)),
      },
    ],
    [],
  );
  const selection = useMemo(() => ({ selectedId, onSelect }), [selectedId, onSelect]);

  return (
    <section aria-labelledby="campaigns-heading">
      <h2 id="campaigns-heading" style={{ fontSize: 18, marginBottom: 12 }}>Campaigns</h2>
      <CampaignFilters shown={campaigns.length} total={total} />
      <SelectionContext.Provider value={selection}>
      <Profiler id="campaign-table" onRender={recordRender}>
        <DataTable
          label="Campaigns"
          rows={campaigns}
          columns={columns}
          getRowId={getRowId}
          virtualizeThreshold={100}
          emptyMessage="No campaigns match your filters"
        />
      </Profiler>
      </SelectionContext.Provider>
    </section>
  );
}
