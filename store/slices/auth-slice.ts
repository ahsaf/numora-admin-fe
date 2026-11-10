import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { authApi } from '@/lib/api/admin-api';
import { getErrorMessage } from '@/lib/api/client';
import type { AdminProfile } from '@/lib/api/types';

type AuthStatus = 'idle' | 'checking' | 'authenticated' | 'unauthenticated';

type AuthState = { status: AuthStatus; profile: AdminProfile | null };

const initialState: AuthState = { status: 'idle', profile: null };

/** Restores the session from the httpOnly cookie. */
export const fetchSession = createAsyncThunk('auth/fetchSession', async () => (await authApi.me()).data);

export const login = createAsyncThunk<AdminProfile, { email: string; password: string }, { rejectValue: string }>(
  'auth/login',
  async (body, { rejectWithValue }) => {
    try {
      return (await authApi.login(body)).data;
    } catch (e) {
      return rejectWithValue(getErrorMessage(e, 'Unable to sign in'));
    }
  },
);

export const logout = createAsyncThunk('auth/logout', async () => {
  try {
    await authApi.logout();
  } catch {
    // The session is cleared locally either way.
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /** Any 401 from the API lands here. */
    sessionExpired(state) {
      state.status = 'unauthenticated';
      state.profile = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSession.pending, (state) => {
        state.status = 'checking';
      })
      .addCase(fetchSession.fulfilled, (state, action) => {
        state.status = 'authenticated';
        state.profile = action.payload;
      })
      .addCase(fetchSession.rejected, (state) => {
        state.status = 'unauthenticated';
        state.profile = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'authenticated';
        state.profile = action.payload;
      })
      .addCase(logout.fulfilled, (state) => {
        state.status = 'unauthenticated';
        state.profile = null;
      });
  },
});

export const { sessionExpired } = authSlice.actions;
export default authSlice.reducer;
