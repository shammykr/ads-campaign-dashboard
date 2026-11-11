import styled, { css } from 'styled-components';
import { focusRing, visuallyHidden } from '../../styles/GlobalStyle';

/** Shared layout primitives for labelled form controls. */
export const FieldWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(1)};
  min-width: 0;
`;

export const Label = styled.label<{ $hidden?: boolean }>`
  font-size: ${({ theme }) => theme.font.size.sm};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  color: ${({ theme }) => theme.colors.text};
  ${({ $hidden }) => $hidden && visuallyHidden}
`;

export const Hint = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.font.size.xs};
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const ErrorText = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.font.size.xs};
  font-weight: ${({ theme }) => theme.font.weight.medium};
  color: ${({ theme }) => theme.colors.danger};
`;

export const controlStyles = css<{ $invalid?: boolean; $compact?: boolean }>`
  width: 100%;
  min-height: ${({ $compact }) => ($compact ? '32px' : '40px')};
  padding: 0 ${({ theme }) => theme.space(3)};
  border: 1px solid ${({ theme, $invalid }) => ($invalid ? theme.colors.danger : theme.colors.borderStrong)};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
  ${focusRing}
  &:disabled { background: ${({ theme }) => theme.colors.surfaceAlt}; }
`;

/** Builds the aria-describedby value from optional hint/error element ids. */
export function describedBy(...ids: Array<string | false | undefined>) {
  const v = ids.filter(Boolean).join(' ');
  return v || undefined;
}
