import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { companiesApi } from '@/lib/api/admin-api';
import { getErrorMessage } from '@/lib/api/client';
import type { CompanyDetail, CompanyUser, ListQuery, PaginatedResponse } from '@/lib/api/types';
import { setCompanyStatus, setCompanyUserStatus, setUserBlocked } from '../thunks';

type State = {
  company: CompanyDetail | null;
  loading: boolean;
  error: string | null;
  users: {
    query: ListQuery;
    items: CompanyUser[];
    totalCount: number;
    loading: boolean;
    error: string | null;
    requestId: string | null;
  };
};

const initialUsers: State['users'] = {
  query: { page: 1, limit: 10, search: '' },
  items: [],
  totalCount: 0,
  loading: false,
  error: null,
  requestId: null,
};

const initialState: State = { company: null, loading: false, error: null, users: initialUsers };

export const fetchCompany = createAsyncThunk<CompanyDetail, number, { rejectValue: string }>(
  'companyDetail/fetch',
  async (id, { rejectWithValue }) => {
    try {
      return (await companiesApi.get(id)).data;
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);

export const fetchCompanyUsers = createAsyncThunk<
  PaginatedResponse<CompanyUser>,
  { companyId: number; query: ListQuery },
  { rejectValue: string }
>('companyDetail/fetchUsers', async ({ companyId, query }, { rejectWithValue }) => {
  try {
    return await companiesApi.users(companyId, query);
  } catch (e) {
    return rejectWithValue(getErrorMessage(e));
  }
});

const companyDetailSlice = createSlice({
  name: 'companyDetail',
  initialState,
  reducers: {
    /** Clears the previous company so its data never flashes on another company's page. */
    resetCompanyDetail(state, action: PayloadAction<number>) {
      if (state.company?.id !== action.payload) {
        return { ...initialState, loading: true };
      }
      return state;
    },
    setCompanyUsersQuery(state, action: PayloadAction<Partial<ListQuery>>) {
      const resetsPage = action.payload.search !== undefined || action.payload.limit !== undefined;
      state.users.query = { ...state.users.query, ...action.payload, ...(resetsPage && { page: 1 }) };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCompany.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCompany.fulfilled, (state, action) => {
        state.loading = false;
        state.company = action.payload;
      })
      .addCase(fetchCompany.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Could not load the company';
      })
      .addCase(fetchCompanyUsers.pending, (state, action) => {
        state.users.loading = true;
        state.users.error = null;
        state.users.requestId = action.meta.requestId;
      })
      .addCase(fetchCompanyUsers.fulfilled, (state, action) => {
        if (state.users.requestId !== action.meta.requestId) return;
        state.users.loading = false;
        state.users.items = action.payload.data;
        state.users.totalCount = action.payload.totalCount;
      })
      .addCase(fetchCompanyUsers.rejected, (state, action) => {
        if (state.users.requestId !== action.meta.requestId) return;
        state.users.loading = false;
        state.users.error = action.payload ?? 'Could not load users';
      })
      .addCase(setCompanyStatus.fulfilled, (state, { payload }) => {
        if (state.company?.id === payload.id) state.company.isActive = payload.isActive;
      })
      .addCase(setCompanyUserStatus.fulfilled, (state, { payload }) => {
        if (state.company?.id !== payload.companyId) return;
        const user = state.users.items.find((u) => u.id === payload.userId);
        if (!user || user.isActive === payload.isActive) return;
        user.isActive = payload.isActive;
        if (!user.isBlocked) state.company.stats.activeUsers += payload.isActive ? 1 : -1;
      })
      .addCase(setUserBlocked.fulfilled, (state, { payload }) => {
        const user = state.users.items.find((u) => u.id === payload.id);
        if (!user || user.isBlocked === payload.blocked || !state.company) return;
        user.isBlocked = payload.blocked;
        state.company.stats.blockedUsers += payload.blocked ? 1 : -1;
        if (user.isActive) state.company.stats.activeUsers += payload.blocked ? -1 : 1;
      });
  },
});

export const { resetCompanyDetail, setCompanyUsersQuery } = companyDetailSlice.actions;
export default companyDetailSlice.reducer;
