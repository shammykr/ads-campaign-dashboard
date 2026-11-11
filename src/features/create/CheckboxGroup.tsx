import { useId } from 'react';
import styled from 'styled-components';

const Fieldset = styled.fieldset`
  margin: 0;
  padding: 0;
  border: 0;
  legend {
    padding: 0;
    margin-bottom: ${({ theme }) => theme.space(2)};
    font-size: ${({ theme }) => theme.font.size.sm};
    font-weight: ${({ theme }) => theme.font.weight.semibold};
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: ${({ theme }) => theme.space(2)};
  label {
    display: flex;
    align-items: center;
    gap: ${({ theme }) => theme.space(2)};
    min-height: 32px;
    cursor: pointer;
  }
  input {
    width: 18px;
    height: 18px;
    accent-color: ${({ theme }) => theme.colors.primary};
  }
  input:focus-visible { outline: 3px solid ${({ theme }) => theme.colors.focus}; outline-offset: 2px; }
`;

const Error = styled.p`
  margin: ${({ theme }) => theme.space(1)} 0 0;
  font-size: ${({ theme }) => theme.font.size.xs};
  color: ${({ theme }) => theme.colors.danger};
`;

interface Props {
  id?: string;
  legend: string;
  name: string;
  options: { value: string; label: string }[];
  value: string[];
  onChange: (value: string[]) => void;
  error?: string;
  required?: boolean;
}

/** Native checkboxes grouped in a fieldset/legend so screen readers announce the group name. */
export function CheckboxGroup({ id, legend, name, options, value, onChange, error, required }: Props) {
  const errorId = useId();
  return (
    <Fieldset id={id} aria-describedby={error ? errorId : undefined} aria-invalid={error ? true : undefined} data-field={name}>
      <legend>
        {legend}
        {required && <span aria-hidden="true"> *</span>}
      </legend>
      <Grid>
        {options.map((o) => (
          <label key={o.value}>
            <input
              type="checkbox"
              name={name}
              value={o.value}
              checked={value.includes(o.value)}
              onChange={(e) =>
                onChange(e.target.checked ? [...value, o.value] : value.filter((v) => v !== o.value))
              }
            />
            {o.label}
          </label>
        ))}
      </Grid>
      {error && <Error id={errorId} role="alert">{error}</Error>}
    </Fieldset>
  );
}
