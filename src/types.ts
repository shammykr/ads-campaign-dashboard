export type CampaignStatus = 'draft' | 'active' | 'paused' | 'ended';

export interface Targeting {
  locations: string[];
  devices: string[];
  ageRange: string;
  interests: string[];
}

export interface Campaign {
  id: string;
  name: string;
  status: CampaignStatus;
  /** Lifetime budget in USD. */
  budget: number;
  startDate: string;
  endDate: string;
  targeting: Targeting;
  spend: number;
  impressions: number;
  clicks: number;
}

export interface NewCampaignInput {
  name: string;
  budget: number;
  startDate: string;
  endDate: string;
  targeting: Targeting;
}

export type CampaignPatch = Partial<Pick<Campaign, 'budget' | 'status'>>;

export interface SpendPoint {
  date: string;
  spend: number;
  cumulativeSpend: number;
  idealSpend: number;
}

export const STATUSES: readonly CampaignStatus[] = ['draft', 'active', 'paused', 'ended'];
