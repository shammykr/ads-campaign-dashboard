import { forwardRef, useId, type InputHTMLAttributes } from 'react';
import styled from 'styled-components';
import { controlStyles, describedBy, ErrorText, FieldWrapper, Hint, Label } from './field';

export interface DatePickerProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange' | 'size'> {
  label: string;
  /** ISO date string (YYYY-MM-DD) or empty string. */
  value: string;
  onChange: (value: string) => void;
  hideLabel?: boolean;
  hint?: string;
  error?: string;
  compact?: boolean;
}

const Input = styled.input<{ $invalid?: boolean; $compact?: boolean }>`
  ${controlStyles}
`;

/**
 * Date input built on the native `<input type="date">`, which ships with a
 * keyboard-operable, screen-reader-friendly calendar in every modern browser.
 */
export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  ({ label, value, onChange, hideLabel, hint, error, compact, id, ...rest }, ref) => {
    const autoId = useId();
    const inputId = id ?? autoId;
    const hintId = `${inputId}-hint`;
    const errorId = error ? `${inputId}-error` : undefined;
    return (
      <FieldWrapper>
        <Label htmlFor={inputId} $hidden={hideLabel}>{label}</Label>
        <Input
          ref={ref}
          id={inputId}
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(hint && hintId, errorId)}
          $invalid={!!error}
          $compact={compact}
          {...rest}
        />
        {hint && <Hint id={hintId}>{hint}</Hint>}
        {error && <ErrorText id={errorId} role="alert">{error}</ErrorText>}
      </FieldWrapper>
    );
  },
);
DatePicker.displayName = 'DatePicker';
