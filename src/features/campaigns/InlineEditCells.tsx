import { memo, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import styled from 'styled-components';
import { Select, StatusBadge, TextField } from '../../components/ui';
import { focusRing } from '../../styles/GlobalStyle';
import { useAppDispatch } from '../../store';
import { updateCampaign } from '../../store/campaignsSlice';
import { STATUSES, type Campaign, type CampaignStatus } from '../../types';
import { formatUsd } from '../../utils/format';

const EditTrigger = styled.button`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(1.5)};
  max-width: 100%;
  padding: ${({ theme }) => `${theme.space(1)} ${theme.space(1.5)}`};
  margin: 0 -${({ theme }) => theme.space(1.5)};
  border: 1px dashed transparent;
  border-radius: ${({ theme }) => theme.radius.sm};
  background: none;
  color: inherit;
  font-variant-numeric: tabular-nums;
  cursor: pointer;
  &:hover { border-color: ${({ theme }) => theme.colors.borderStrong}; }
  ${focusRing}
  .pencil { color: ${({ theme }) => theme.colors.textMuted}; font-size: 11px; }
`;

/** Shared inline-edit behaviour: focus the editor on open, return focus to the trigger on close. */
function useInlineEdit() {
  const [editing, setEditing] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const wasEditing = useRef(false);
  useEffect(() => {
    if (wasEditing.current && !editing) triggerRef.current?.focus();
    wasEditing.current = editing;
  }, [editing]);
  return { editing, setEditing, triggerRef };
}

export const BudgetCell = memo(function BudgetCell({ campaign }: { campaign: Campaign }) {
  const dispatch = useAppDispatch();
  const { editing, setEditing, triggerRef } = useInlineEdit();
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string>();

  const open = () => {
    setDraft(String(campaign.budget));
    setError(undefined);
    setEditing(true);
  };

  const commit = () => {
    const value = Number(draft);
    if (!Number.isFinite(value) || value < 100) {
      setError('Minimum $100');
      return;
    }
    if (value !== campaign.budget) dispatch(updateCampaign({ id: campaign.id, patch: { budget: value } }));
    setEditing(false);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') commit();
    if (e.key === 'Escape') {
      e.stopPropagation();
      setEditing(false);
    }
  };

  if (!editing) {
    return (
      <EditTrigger ref={triggerRef} onClick={open} aria-label={`Budget ${formatUsd(campaign.budget)}. Edit budget for ${campaign.name}`}>
        {formatUsd(campaign.budget)}
        <span className="pencil" aria-hidden="true">✎</span>
      </EditTrigger>
    );
  }

  return (
    <TextField
      label={`Budget for ${campaign.name} (Enter to save, Escape to cancel)`}
      hideLabel
      compact
      type="number"
      min={100}
      step={100}
      inputMode="numeric"
      // eslint-disable-next-line jsx-a11y/no-autofocus -- focus moves into the editor the user just opened
      autoFocus
      value={draft}
      error={error}
      onChange={(e) => setDraft(e.target.value)}
      onKeyDown={onKeyDown}
      onBlur={commit}
    />
  );
});

const STATUS_OPTIONS = STATUSES.map((s) => ({ value: s, label: s[0].toUpperCase() + s.slice(1) }));

export const StatusCell = memo(function StatusCell({ campaign }: { campaign: Campaign }) {
  const dispatch = useAppDispatch();
  const { editing, setEditing, triggerRef } = useInlineEdit();

  if (!editing) {
    return (
      <EditTrigger ref={triggerRef} onClick={() => setEditing(true)} aria-label={`Status ${campaign.status}. Edit status for ${campaign.name}`}>
        <StatusBadge status={campaign.status} />
        <span className="pencil" aria-hidden="true">✎</span>
      </EditTrigger>
    );
  }

  return (
    <Select
      label={`Status for ${campaign.name}`}
      hideLabel
      compact
      options={STATUS_OPTIONS}
      // eslint-disable-next-line jsx-a11y/no-autofocus -- focus moves into the editor the user just opened
      autoFocus
      defaultValue={campaign.status}
      onChange={(e) => {
        const status = e.target.value as CampaignStatus;
        if (status !== campaign.status) dispatch(updateCampaign({ id: campaign.id, patch: { status } }));
        setEditing(false);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.stopPropagation();
          setEditing(false);
        }
      }}
      onBlur={() => setEditing(false)}
    />
  );
});
