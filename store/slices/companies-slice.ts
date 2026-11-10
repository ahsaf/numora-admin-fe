import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { companiesApi } from '@/lib/api/admin-api';
import { getErrorMessage } from '@/lib/api/client';
import type { CompanyListItem, CompanyListResponse, CompanyStatusFilter, CompanySummary, ListQuery } from '@/lib/api/types';
import { setCompanyStatus } from '../thunks';

type Query = ListQuery & { status: CompanyStatusFilter };

type State = {
  query: Query;
  items: CompanyListItem[];
  totalCount: number;
  summary: CompanySummary;
  loading: boolean;
  error: string | null;
  requestId: string | null;
};

const initialState: State = {
  query: { page: 1, limit: 10, search: '', status: 'all' },
  items: [],
  totalCount: 0,
  summary: { all: 0, active: 0, inactive: 0 },
  loading: false,
  error: null,
  requestId: null,
};

export const fetchCompanies = createAsyncThunk<CompanyListResponse, Query, { rejectValue: string }>(
  'companies/fetch',
  async (query, { rejectWithValue }) => {
    try {
      return await companiesApi.list(query);
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);

const companiesSlice = createSlice({
  name: 'companies',
  initialState,
  reducers: {
    /** Changing a filter or the search goes back to page 1. */
    setCompaniesQuery(state, action: PayloadAction<Partial<Query>>) {
      const resetsPage = Object.keys(action.payload).some((k) => k !== 'page');
      state.query = { ...state.query, ...action.payload, ...(resetsPage && !action.payload.page && { page: 1 }) };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCompanies.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.requestId = action.meta.requestId;
      })
      .addCase(fetchCompanies.fulfilled, (state, action) => {
        // Ignore a slower, older request that finishes after a newer one.
        if (state.requestId !== action.meta.requestId) return;
        state.loading = false;
        state.items = action.payload.data;
        state.totalCount = action.payload.totalCount;
        state.summary = action.payload.summary;
      })
      .addCase(fetchCompanies.rejected, (state, action) => {
        if (state.requestId !== action.meta.requestId) return;
        state.loading = false;
        state.error = action.payload ?? 'Could not load companies';
      })
      .addCase(setCompanyStatus.fulfilled, (state, { payload }) => {
        const item = state.items.find((c) => c.id === payload.id);
        if (item && item.isActive !== payload.isActive) {
          item.isActive = payload.isActive;
          state.summary.active += payload.isActive ? 1 : -1;
          state.summary.inactive += payload.isActive ? -1 : 1;
        }
      });
  },
});

export const { setCompaniesQuery } = companiesSlice.actions;
export default companiesSlice.reducer;
