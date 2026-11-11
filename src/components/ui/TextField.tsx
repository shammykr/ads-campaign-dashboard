import { forwardRef, useId, type InputHTMLAttributes } from 'react';
import styled from 'styled-components';
import { controlStyles, describedBy, ErrorText, FieldWrapper, Hint, Label } from './field';

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: string;
  hideLabel?: boolean;
  hint?: string;
  error?: string;
  compact?: boolean;
}

const Input = styled.input<{ $invalid?: boolean; $compact?: boolean }>`
  ${controlStyles}
`;

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  ({ label, hideLabel, hint, error, compact, id, ...rest }, ref) => {
    const autoId = useId();
    const inputId = id ?? autoId;
    const hintId = hint ? `${inputId}-hint` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;
    return (
      <FieldWrapper>
        <Label htmlFor={inputId} $hidden={hideLabel}>{label}</Label>
        <Input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(hintId, errorId)}
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
TextField.displayName = 'TextField';
