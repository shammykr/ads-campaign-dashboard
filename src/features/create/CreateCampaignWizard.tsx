import { useEffect, useRef, useState, type FormEvent } from 'react';
import styled from 'styled-components';
import { Button, DatePicker, Modal, Select, TextField } from '../../components/ui';
import { useAppDispatch } from '../../store';
import { createCampaign } from '../../store/campaignsSlice';
import type { Campaign } from '../../types';
import { addDaysISO, formatShortDate, formatUsd, todayISO } from '../../utils/format';
import { CheckboxGroup } from './CheckboxGroup';
import { AGE_RANGES, DEVICES, INTERESTS, LOCATIONS, labelFor } from './options';
import { STEPS, toInput, validateStep, type FormErrors, type WizardForm } from './validation';

const FIELD_IDS: Record<keyof WizardForm, string> = {
  name: 'cw-name',
  budget: 'cw-budget',
  startDate: 'cw-start',
  endDate: 'cw-end',
  ageRange: 'cw-age',
  locations: 'cw-locations',
  devices: 'cw-devices',
  interests: 'cw-interests',
};

const emptyForm = (): WizardForm => ({
  name: '',
  budget: '',
  startDate: todayISO(),
  endDate: addDaysISO(todayISO(), 29),
  locations: [],
  devices: [],
  ageRange: '',
  interests: [],
});

const Steps = styled.ol`
  display: flex;
  gap: ${({ theme }) => theme.space(2)};
  margin: 0 0 ${({ theme }) => theme.space(5)};
  padding: 0;
  list-style: none;
  counter-reset: step;
  li {
    flex: 1;
    padding-top: ${({ theme }) => theme.space(2)};
    border-top: 4px solid ${({ theme }) => theme.colors.border};
    font-size: ${({ theme }) => theme.font.size.xs};
    color: ${({ theme }) => theme.colors.textMuted};
    counter-increment: step;
    &::before { content: counter(step) '. '; }
  }
  li[data-state='done'] { border-color: ${({ theme }) => theme.colors.primary}; }
  li[aria-current='step'] {
    border-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.text};
    font-weight: ${({ theme }) => theme.font.weight.semibold};
  }
`;

const StepHeading = styled.h3`
  font-size: ${({ theme }) => theme.font.size.lg};
  margin-bottom: ${({ theme }) => theme.space(4)};
  &:focus { outline: none; }
  &:focus-visible { outline: 3px solid ${({ theme }) => theme.colors.focus}; }
`;

const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(4)};
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.space(3)};
`;

const ErrorSummary = styled.div`
  margin-bottom: ${({ theme }) => theme.space(4)};
  padding: ${({ theme }) => theme.space(3)} ${({ theme }) => theme.space(4)};
  border-left: 4px solid ${({ theme }) => theme.colors.danger};
  background: ${({ theme }) => theme.colors.dangerSubtle};
  color: ${({ theme }) => theme.colors.danger};
  h4 { margin: 0 0 ${({ theme }) => theme.space(1)}; }
  ul { margin: 0; padding-left: ${({ theme }) => theme.space(5)}; }
  a { color: inherit; }
`;

const Review = styled.dl`
  display: grid;
  grid-template-columns: 160px 1fr;
  gap: ${({ theme }) => theme.space(2)} ${({ theme }) => theme.space(4)};
  margin: 0;
  dt { color: ${({ theme }) => theme.colors.textMuted}; }
  dd { margin: 0; font-weight: ${({ theme }) => theme.font.weight.medium}; }
`;

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (campaign: Campaign) => void;
}

export function CreateCampaignWizard({ open, onClose, onCreated }: Props) {
  const dispatch = useAppDispatch();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<WizardForm>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);

  // Reset the wizard each time it opens.
  useEffect(() => {
    if (open) {
      setStep(0);
      setForm(emptyForm());
      setErrors({});
      setSubmitError(undefined);
    }
  }, [open]);

  // Move focus to the new step's heading so screen readers announce it.
  const goToStep = (n: number) => {
    setStep(n);
    requestAnimationFrame(() => headingRef.current?.focus());
  };

  const set = <K extends keyof WizardForm>(key: K, value: WizardForm[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const focusField = (key: keyof WizardForm) => {
    const el = document.getElementById(FIELD_IDS[key]);
    const target = el?.tagName === 'FIELDSET' ? el.querySelector('input') : el;
    (target as HTMLElement | null)?.focus();
  };

  const showErrors = (errs: FormErrors) => {
    setErrors(errs);
    const first = Object.keys(errs)[0] as keyof WizardForm | undefined;
    if (first) requestAnimationFrame(() => focusField(first));
  };

  const next = () => {
    const errs = validateStep(step, form);
    if (Object.keys(errs).length) return showErrors(errs);
    setErrors({});
    goToStep(step + 1);
  };

  const back = () => {
    setErrors({});
    goToStep(step - 1);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (step < STEPS.length - 1) return next();
    setSubmitting(true);
    setSubmitError(undefined);
    const result = await dispatch(createCampaign(toInput(form)));
    setSubmitting(false);
    if (createCampaign.fulfilled.match(result)) {
      onCreated(result.payload);
      onClose();
      return;
    }
    const fieldErrors = result.payload?.fieldErrors;
    if (fieldErrors) {
      // Jump back to the first step that has a server-side error.
      const errs = fieldErrors as FormErrors;
      const stepIdx = STEPS.findIndex((s) => s.fields.some((f) => errs[f as keyof WizardForm]));
      if (stepIdx >= 0) setStep(stepIdx);
      showErrors(errs);
    } else {
      setSubmitError(result.payload?.message ?? 'Could not create campaign.');
      requestAnimationFrame(() => summaryRef.current?.focus());
    }
  };

  const errorEntries = Object.entries(errors).filter(([, v]) => v) as [keyof WizardForm, string][];
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create campaign"
      description={`Step ${step + 1} of ${STEPS.length}: ${current.title}`}
      initialFocusRef={nameRef}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          {step > 0 && <Button variant="secondary" onClick={back}>Back</Button>}
          <Button type="submit" form="create-campaign-form" disabled={submitting}>
            {isLast ? (submitting ? 'Creating…' : 'Create campaign') : 'Next'}
          </Button>
        </>
      }
    >
      <Steps aria-label="Progress">
        {STEPS.map((s, i) => (
          <li key={s.key} aria-current={i === step ? 'step' : undefined} data-state={i < step ? 'done' : undefined}>
            {s.title}
            {i < step && <span className="sr-only"> (completed)</span>}
          </li>
        ))}
      </Steps>

      <form id="create-campaign-form" onSubmit={submit} noValidate>
        <StepHeading ref={headingRef} tabIndex={-1}>{current.title}</StepHeading>

        {(errorEntries.length > 0 || submitError) && (
          <ErrorSummary ref={summaryRef} tabIndex={-1} role="alert" aria-labelledby="cw-error-title">
            <h4 id="cw-error-title">Please fix the following</h4>
            <ul>
              {submitError && <li>{submitError}</li>}
              {errorEntries.map(([key, msg]) => (
                <li key={key}>
                  <a
                    href={`#${FIELD_IDS[key]}`}
                    onClick={(e) => {
                      e.preventDefault();
                      focusField(key);
                    }}
                  >
                    {msg}
                  </a>
                </li>
              ))}
            </ul>
          </ErrorSummary>
        )}

        {step === 0 && (
          <Stack>
            <TextField
              ref={nameRef}
              id={FIELD_IDS.name}
              label="Campaign name"
              required
              aria-required="true"
              maxLength={80}
              autoComplete="off"
              hint="Shown in reports. 3–80 characters."
              value={form.name}
              error={errors.name}
              onChange={(e) => set('name', e.target.value)}
            />
          </Stack>
        )}

        {step === 1 && (
          <Stack>
            <TextField
              id={FIELD_IDS.budget}
              label="Lifetime budget (USD)"
              type="number"
              inputMode="decimal"
              min={100}
              step={100}
              required
              aria-required="true"
              hint="Minimum $100. Spend is paced evenly across the flight."
              value={form.budget}
              error={errors.budget}
              onChange={(e) => set('budget', e.target.value)}
            />
            <Row>
              <DatePicker
                id={FIELD_IDS.startDate}
                label="Start date"
                required
                aria-required="true"
                value={form.startDate}
                error={errors.startDate}
                onChange={(v) => set('startDate', v)}
              />
              <DatePicker
                id={FIELD_IDS.endDate}
                label="End date"
                required
                aria-required="true"
                min={form.startDate || undefined}
                value={form.endDate}
                error={errors.endDate}
                onChange={(v) => set('endDate', v)}
              />
            </Row>
          </Stack>
        )}

        {step === 2 && (
          <Stack>
            <CheckboxGroup
              legend="Locations"
              id={FIELD_IDS.locations}
              name="locations"
              required
              options={LOCATIONS}
              value={form.locations}
              error={errors.locations}
              onChange={(v) => set('locations', v)}
            />
            <CheckboxGroup
              legend="Devices"
              id={FIELD_IDS.devices}
              name="devices"
              required
              options={DEVICES}
              value={form.devices}
              error={errors.devices}
              onChange={(v) => set('devices', v)}
            />
            <Select
              id={FIELD_IDS.ageRange}
              label="Age range"
              required
              aria-required="true"
              placeholder="Select an age range"
              options={AGE_RANGES}
              value={form.ageRange}
              error={errors.ageRange}
              onChange={(e) => set('ageRange', e.target.value)}
            />
            <CheckboxGroup
              legend="Interests (optional)"
              id={FIELD_IDS.interests}
              name="interests"
              options={INTERESTS}
              value={form.interests}
              onChange={(v) => set('interests', v)}
            />
          </Stack>
        )}

        {step === 3 && (
          <Review>
            <dt>Name</dt><dd>{form.name}</dd>
            <dt>Budget</dt><dd>{formatUsd(Number(form.budget))}</dd>
            <dt>Flight</dt><dd>{formatShortDate(form.startDate)} – {formatShortDate(form.endDate)}</dd>
            <dt>Locations</dt><dd>{form.locations.map((v) => labelFor(LOCATIONS, v)).join(', ')}</dd>
            <dt>Devices</dt><dd>{form.devices.map((v) => labelFor(DEVICES, v)).join(', ')}</dd>
            <dt>Age range</dt><dd>{form.ageRange}</dd>
            <dt>Interests</dt><dd>{form.interests.length ? form.interests.map((v) => labelFor(INTERESTS, v)).join(', ') : 'None'}</dd>
          </Review>
        )}
      </form>
    </Modal>
  );
}
