import { createSlice, nanoid, type PayloadAction } from '@reduxjs/toolkit';

export type Toast = { id: string; tone: 'success' | 'error' | 'info'; message: string };

const uiSlice = createSlice({
  name: 'ui',
  initialState: { toasts: [] as Toast[], sidebarOpen: false },
  reducers: {
    notify: {
      reducer(state, action: PayloadAction<Toast>) {
        state.toasts = [...state.toasts.slice(-3), action.payload];
      },
      prepare(tone: Toast['tone'], message: string) {
        return { payload: { id: nanoid(), tone, message } };
      },
    },
    dismissToast(state, action: PayloadAction<string>) {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
    setSidebarOpen(state, action: PayloadAction<boolean>) {
      state.sidebarOpen = action.payload;
    },
  },
});

export const { notify, dismissToast, setSidebarOpen } = uiSlice.actions;
export default uiSlice.reducer;
