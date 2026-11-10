import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { usersApi } from '@/lib/api/admin-api';
import { getErrorMessage } from '@/lib/api/client';
import type { BlockedUser, ListQuery, PaginatedResponse } from '@/lib/api/types';
import { setUserBlocked } from '../thunks';

type State = {
  query: ListQuery;
  items: BlockedUser[];
  totalCount: number;
  loading: boolean;
  error: string | null;
  requestId: string | null;
};

const initialState: State = {
  query: { page: 1, limit: 10, search: '' },
  items: [],
  totalCount: 0,
  loading: false,
  error: null,
  requestId: null,
};

export const fetchBlockedUsers = createAsyncThunk<PaginatedResponse<BlockedUser>, ListQuery, { rejectValue: string }>(
  'blockedUsers/fetch',
  async (query, { rejectWithValue }) => {
    try {
      return await usersApi.blocked(query);
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);

const blockedUsersSlice = createSlice({
  name: 'blockedUsers',
  initialState,
  reducers: {
    setBlockedUsersQuery(state, action: PayloadAction<Partial<ListQuery>>) {
      const resetsPage = action.payload.search !== undefined || action.payload.limit !== undefined;
      state.query = { ...state.query, ...action.payload, ...(resetsPage && { page: 1 }) };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBlockedUsers.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.requestId = action.meta.requestId;
      })
      .addCase(fetchBlockedUsers.fulfilled, (state, action) => {
        if (state.requestId !== action.meta.requestId) return;
        state.loading = false;
        state.items = action.payload.data;
        state.totalCount = action.payload.totalCount;
      })
      .addCase(fetchBlockedUsers.rejected, (state, action) => {
        if (state.requestId !== action.meta.requestId) return;
        state.loading = false;
        state.error = action.payload ?? 'Could not load blocked users';
      })
      .addCase(setUserBlocked.fulfilled, (state, { payload }) => {
        // A newly blocked user appears on the next fetch (the page refetches on open).
        if (payload.blocked) return;
        const before = state.items.length;
        state.items = state.items.filter((u) => u.id !== payload.id);
        if (state.items.length < before) state.totalCount -= 1;
      });
  },
});

export const { setBlockedUsersQuery } = blockedUsersSlice.actions;
export default blockedUsersSlice.reducer;
