import type { Campaign, CampaignPatch, NewCampaignInput, SpendPoint } from '../types';

export class ApiError extends Error {
  constructor(message: string, public status: number, public fieldErrors?: Record<string, string>) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(body.error ?? `Request failed (${res.status})`, res.status, body.errors);
  }
  return body as T;
}

export const api = {
  listCampaigns: () => request<Campaign[]>('/campaigns'),
  createCampaign: (input: NewCampaignInput) =>
    request<Campaign>('/campaigns', { method: 'POST', body: JSON.stringify(input) }),
  updateCampaign: (id: string, patch: CampaignPatch) =>
    request<Campaign>(`/campaigns/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  getSpend: (id: string, from?: string, to?: string) => {
    const q = new URLSearchParams();
    if (from) q.set('from', from);
    if (to) q.set('to', to);
    return request<SpendPoint[]>(`/campaigns/${id}/spend?${q}`);
  },
};
