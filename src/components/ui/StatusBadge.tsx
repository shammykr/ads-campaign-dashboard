import { memo } from 'react';
import styled from 'styled-components';
import type { Theme } from '../../styles/theme';

export type Status = keyof Theme['colors']['status'];

const Badge = styled.span<{ $status: Status }>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(1.5)};
  padding: 2px ${({ theme }) => theme.space(2)};
  border-radius: 999px;
  font-size: ${({ theme }) => theme.font.size.xs};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  background: ${({ theme, $status }) => theme.colors.status[$status].bg};
  color: ${({ theme, $status }) => theme.colors.status[$status].fg};
  &::before {
    content: '';
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: ${({ theme, $status }) => theme.colors.status[$status].dot};
  }
`;

const LABELS: Record<Status, string> = {
  active: 'Active',
  paused: 'Paused',
  draft: 'Draft',
  ended: 'Ended',
};

/** Status pill: always shows the text label so meaning never relies on color alone. */
export const StatusBadge = memo(function StatusBadge({ status }: { status: Status }) {
  return <Badge $status={status}>{LABELS[status]}</Badge>;
});
