import { createAsyncThunk } from '@reduxjs/toolkit';
import { companiesApi, usersApi } from '@/lib/api/admin-api';
import { getErrorMessage } from '@/lib/api/client';

/*
 * Mutations that more than one slice reacts to (e.g. blocking a user updates both the
 * company's user list and the blocked-users list). Kept here to avoid slice cycles.
 */

export const setCompanyStatus = createAsyncThunk<
  { id: number; isActive: boolean; message?: string },
  { id: number; isActive: boolean },
  { rejectValue: string }
>('companies/setStatus', async ({ id, isActive }, { rejectWithValue }) => {
  try {
    const res = await companiesApi.setStatus(id, isActive);
    return { ...res.data, message: res.message };
  } catch (e) {
    return rejectWithValue(getErrorMessage(e));
  }
});

export const setCompanyUserStatus = createAsyncThunk<
  { companyId: number; userId: number; isActive: boolean; message?: string },
  { companyId: number; userId: number; isActive: boolean },
  { rejectValue: string }
>('companies/setUserStatus', async ({ companyId, userId, isActive }, { rejectWithValue }) => {
  try {
    const res = await companiesApi.setUserStatus(companyId, userId, isActive);
    return { ...res.data, message: res.message };
  } catch (e) {
    return rejectWithValue(getErrorMessage(e));
  }
});

export const setUserBlocked = createAsyncThunk<
  { id: number; blocked: boolean; message?: string },
  { id: number; blocked: boolean },
  { rejectValue: string }
>('users/setBlocked', async ({ id, blocked }, { rejectWithValue }) => {
  try {
    const res = await usersApi.setBlocked(id, blocked);
    return { ...res.data, message: res.message };
  } catch (e) {
    return rejectWithValue(getErrorMessage(e));
  }
});
