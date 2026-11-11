import styled from 'styled-components';
import { Select, TextField } from '../../components/ui';
import { useAppDispatch, useAppSelector } from '../../store';
import { selectFilters, setSearch, setStatusFilter, type CampaignFilters as Filters } from '../../store/campaignsSlice';
import { STATUSES } from '../../types';

const Bar = styled.div`
  display: grid;
  grid-template-columns: minmax(220px, 360px) 180px 1fr;
  align-items: end;
  gap: ${({ theme }) => theme.space(3)};
  margin-bottom: ${({ theme }) => theme.space(3)};
`;

const Count = styled.p`
  margin: 0 0 ${({ theme }) => theme.space(2.5)};
  justify-self: end;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.font.size.sm};
`;

const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  ...STATUSES.map((s) => ({ value: s, label: s[0].toUpperCase() + s.slice(1) })),
];

export function CampaignFilters({ shown, total }: { shown: number; total: number }) {
  const dispatch = useAppDispatch();
  const { search, status } = useAppSelector(selectFilters);
  return (
    <Bar role="search" aria-label="Filter campaigns">
      <TextField
        label="Search campaigns"
        type="search"
        placeholder="Name or ID"
        value={search}
        onChange={(e) => dispatch(setSearch(e.target.value))}
      />
      <Select
        label="Status"
        options={STATUS_OPTIONS}
        value={status}
        onChange={(e) => dispatch(setStatusFilter(e.target.value as Filters['status']))}
      />
      <Count role="status" aria-live="polite">
        Showing {shown} of {total} campaigns
      </Count>
    </Bar>
  );
}
