import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { dashboardApi } from '@/lib/api/admin-api';
import { getErrorMessage } from '@/lib/api/client';
import type { Dashboard } from '@/lib/api/types';

type State = { data: Dashboard | null; loading: boolean; error: string | null; loadedAt: number | null };

const initialState: State = { data: null, loading: false, error: null, loadedAt: null };

export const fetchDashboard = createAsyncThunk<Dashboard, void, { rejectValue: string }>(
  'dashboard/fetch',
  async (_, { rejectWithValue }) => {
    try {
      return (await dashboardApi.get()).data;
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboard.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
        state.loadedAt = Date.now();
      })
      .addCase(fetchDashboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Could not load the dashboard';
      });
  },
});

export default dashboardSlice.reducer;
