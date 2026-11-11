import { forwardRef, useId, type SelectHTMLAttributes } from 'react';
import styled from 'styled-components';
import { controlStyles, describedBy, ErrorText, FieldWrapper, Hint, Label } from './field';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label: string;
  options: readonly SelectOption[];
  hideLabel?: boolean;
  hint?: string;
  error?: string;
  compact?: boolean;
  placeholder?: string;
}

const StyledSelect = styled.select<{ $invalid?: boolean; $compact?: boolean }>`
  ${controlStyles}
  padding-right: ${({ theme }) => theme.space(8)};
  cursor: pointer;
`;

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, hideLabel, hint, error, compact, placeholder, id, ...rest }, ref) => {
    const autoId = useId();
    const selectId = id ?? autoId;
    const hintId = hint ? `${selectId}-hint` : undefined;
    const errorId = error ? `${selectId}-error` : undefined;
    return (
      <FieldWrapper>
        <Label htmlFor={selectId} $hidden={hideLabel}>{label}</Label>
        <StyledSelect
          ref={ref}
          id={selectId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(hintId, errorId)}
          $invalid={!!error}
          $compact={compact}
          {...rest}
        >
          {placeholder !== undefined && <option value="">{placeholder}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </StyledSelect>
        {hint && <Hint id={hintId}>{hint}</Hint>}
        {error && <ErrorText id={errorId} role="alert">{error}</ErrorText>}
      </FieldWrapper>
    );
  },
);
Select.displayName = 'Select';
