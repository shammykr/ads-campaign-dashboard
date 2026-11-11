import { forwardRef, type ButtonHTMLAttributes } from 'react';
import styled, { css } from 'styled-components';
import { focusRing } from '../../styles/GlobalStyle';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variants = {
  primary: css`
    background: ${({ theme }) => theme.colors.primary};
    color: #fff;
    border-color: ${({ theme }) => theme.colors.primary};
    &:hover:not(:disabled) { background: ${({ theme }) => theme.colors.primaryHover}; }
  `,
  secondary: css`
    background: ${({ theme }) => theme.colors.surface};
    color: ${({ theme }) => theme.colors.text};
    border-color: ${({ theme }) => theme.colors.borderStrong};
    &:hover:not(:disabled) { background: ${({ theme }) => theme.colors.surfaceAlt}; }
  `,
  ghost: css`
    background: transparent;
    color: ${({ theme }) => theme.colors.primary};
    border-color: transparent;
    &:hover:not(:disabled) { background: ${({ theme }) => theme.colors.primarySubtle}; }
  `,
  danger: css`
    background: ${({ theme }) => theme.colors.danger};
    color: #fff;
    border-color: ${({ theme }) => theme.colors.danger};
  `,
};

const StyledButton = styled.button<{ $variant: Variant; $size: Size }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.space(2)};
  border: 1px solid;
  border-radius: ${({ theme }) => theme.radius.md};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  cursor: pointer;
  white-space: nowrap;
  min-height: ${({ $size }) => ($size === 'sm' ? '32px' : '40px')};
  padding: ${({ theme, $size }) => ($size === 'sm' ? `0 ${theme.space(3)}` : `0 ${theme.space(4)}`)};
  font-size: ${({ theme, $size }) => ($size === 'sm' ? theme.font.size.sm : theme.font.size.md)};
  ${({ $variant }) => variants[$variant]}
  ${focusRing}
  &:disabled { opacity: 0.55; cursor: not-allowed; }
`;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', type = 'button', ...rest }, ref) => (
    <StyledButton ref={ref} type={type} $variant={variant} $size={size} {...rest} />
  ),
);
Button.displayName = 'Button';
