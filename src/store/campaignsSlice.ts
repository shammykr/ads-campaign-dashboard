import { createAsyncThunk, createEntityAdapter, createSelector, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { api, ApiError } from '../api/client';
import type { Campaign, CampaignPatch, CampaignStatus, NewCampaignInput } from '../types';
import type { RootState } from './index';

/**
 * Campaigns are stored normalized ({ ids, entities }) via an entity adapter.
 * Updating one campaign replaces only that entity object, so memoized table
 * rows for every other campaign keep referential equality and skip rendering.
 */
export const campaignsAdapter = createEntityAdapter<Campaign>({
  sortComparer: (a, b) => a.id.localeCompare(b.id),
});

export interface CampaignFilters {
  search: string;
  status: CampaignStatus | 'all';
}

type LoadState = 'idle' | 'loading' | 'succeeded' | 'failed';

const initialState = campaignsAdapter.getInitialState({
  loadState: 'idle' as LoadState,
  error: null as string | null,
  filters: { search: '', status: 'all' } as CampaignFilters,
  /** Previous values kept while an optimistic edit is in flight. */
  pendingEdits: {} as Record<string, CampaignPatch>,
});

export const fetchCampaigns = createAsyncThunk('campaigns/fetchAll', () => api.listCampaigns());

export const createCampaign = createAsyncThunk<
  Campaign,
  NewCampaignInput,
  { rejectValue: { message: string; fieldErrors?: Record<string, string> } }
>('campaigns/create', async (input, { rejectWithValue }) => {
  try {
    return await api.createCampaign(input);
  } catch (e) {
    const err = e as ApiError;
    return rejectWithValue({ message: err.message, fieldErrors: err.fieldErrors });
  }
});

export const updateCampaign = createAsyncThunk(
  'campaigns/update',
  ({ id, patch }: { id: string; patch: CampaignPatch }) => api.updateCampaign(id, patch),
);

const campaignsSlice = createSlice({
  name: 'campaigns',
  initialState,
  reducers: {
    setSearch(state, action: PayloadAction<string>) {
      state.filters.search = action.payload;
    },
    setStatusFilter(state, action: PayloadAction<CampaignFilters['status']>) {
      state.filters.status = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCampaigns.pending, (state) => {
        state.loadState = 'loading';
        state.error = null;
      })
      .addCase(fetchCampaigns.fulfilled, (state, action) => {
        state.loadState = 'succeeded';
        campaignsAdapter.setAll(state, action.payload);
      })
      .addCase(fetchCampaigns.rejected, (state, action) => {
        state.loadState = 'failed';
        state.error = action.error.message ?? 'Failed to load campaigns';
      })
      .addCase(createCampaign.fulfilled, (state, action) => {
        campaignsAdapter.addOne(state, action.payload);
      })
      // Optimistic inline edits: apply immediately, roll back on failure.
      .addCase(updateCampaign.pending, (state, action) => {
        const { id, patch } = action.meta.arg;
        const current = state.entities[id];
        if (!current) return;
        const previous: CampaignPatch = {};
        if (patch.budget !== undefined) previous.budget = current.budget;
        if (patch.status !== undefined) previous.status = current.status;
        state.pendingEdits[id] = previous;
        campaignsAdapter.updateOne(state, { id, changes: patch });
      })
      .addCase(updateCampaign.fulfilled, (state, action) => {
        delete state.pendingEdits[action.payload.id];
        campaignsAdapter.upsertOne(state, action.payload);
      })
      .addCase(updateCampaign.rejected, (state, action) => {
        const { id } = action.meta.arg;
        const previous = state.pendingEdits[id];
        if (previous) campaignsAdapter.updateOne(state, { id, changes: previous });
        delete state.pendingEdits[id];
        state.error = action.error.message ?? 'Update failed';
      });
  },
});

export const { setSearch, setStatusFilter } = campaignsSlice.actions;
export default campaignsSlice.reducer;

const selectCampaignsState = (state: RootState) => state.campaigns;
export const {
  selectAll: selectAllCampaigns,
  selectById: selectCampaignById,
  selectTotal: selectCampaignCount,
} = campaignsAdapter.getSelectors(selectCampaignsState);

export const selectFilters = (state: RootState) => state.campaigns.filters;
export const selectLoadState = (state: RootState) => state.campaigns.loadState;
export const selectCampaignsError = (state: RootState) => state.campaigns.error;

export const selectFilteredCampaigns = createSelector(
  [selectAllCampaigns, selectFilters],
  (campaigns, { search, status }) => {
    const q = search.trim().toLowerCase();
    if (!q && status === 'all') return campaigns;
    return campaigns.filter(
      (c) => (status === 'all' || c.status === status) && (!q || c.name.toLowerCase().includes(q) || c.id.includes(q)),
    );
  },
);
