import type { NewCampaignInput } from '../../types';

export interface WizardForm {
  name: string;
  budget: string;
  startDate: string;
  endDate: string;
  locations: string[];
  devices: string[];
  ageRange: string;
  interests: string[];
}

export type FormErrors = Partial<Record<keyof WizardForm, string>>;

export const STEPS = [
  { key: 'basics', title: 'Campaign details', fields: ['name'] },
  { key: 'budget', title: 'Budget & schedule', fields: ['budget', 'startDate', 'endDate'] },
  { key: 'targeting', title: 'Targeting', fields: ['locations', 'devices', 'ageRange', 'interests'] },
  { key: 'review', title: 'Review & create', fields: [] },
] as const satisfies readonly { key: string; title: string; fields: readonly (keyof WizardForm)[] }[];

export function validateStep(step: number, f: WizardForm): FormErrors {
  const e: FormErrors = {};
  if (step === 0) {
    if (f.name.trim().length < 3) e.name = 'Enter a campaign name of at least 3 characters.';
    else if (f.name.length > 80) e.name = 'Campaign name must be 80 characters or fewer.';
  }
  if (step === 1) {
    const budget = Number(f.budget);
    if (!f.budget || !Number.isFinite(budget)) e.budget = 'Enter a lifetime budget in US dollars.';
    else if (budget < 100) e.budget = 'Budget must be at least $100.';
    if (!f.startDate) e.startDate = 'Choose a start date.';
    if (!f.endDate) e.endDate = 'Choose an end date.';
    else if (f.startDate && f.endDate < f.startDate) e.endDate = 'End date must be on or after the start date.';
  }
  if (step === 2) {
    if (!f.locations.length) e.locations = 'Select at least one location.';
    if (!f.devices.length) e.devices = 'Select at least one device type.';
    if (!f.ageRange) e.ageRange = 'Choose an age range.';
  }
  return e;
}

export const toInput = (f: WizardForm): NewCampaignInput => ({
  name: f.name.trim(),
  budget: Number(f.budget),
  startDate: f.startDate,
  endDate: f.endDate,
  targeting: { locations: f.locations, devices: f.devices, ageRange: f.ageRange, interests: f.interests },
});
