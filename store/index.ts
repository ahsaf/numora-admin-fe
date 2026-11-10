import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { setUnauthorizedHandler } from '@/lib/api/client';
import authReducer, { logout, sessionExpired } from './slices/auth-slice';
import blockedUsersReducer from './slices/blocked-users-slice';
import companiesReducer from './slices/companies-slice';
import companyDetailReducer from './slices/company-detail-slice';
import dashboardReducer from './slices/dashboard-slice';
import uiReducer from './slices/ui-slice';

const appReducer = combineReducers({
  auth: authReducer,
  ui: uiReducer,
  dashboard: dashboardReducer,
  companies: companiesReducer,
  companyDetail: companyDetailReducer,
  blockedUsers: blockedUsersReducer,
});

type AppState = ReturnType<typeof appReducer>;

/** Signing out (or a 401) drops every cached admin list, keeping only auth. */
const rootReducer: typeof appReducer = (state, action) => {
  if (state && (logout.fulfilled.match(action) || sessionExpired.match(action))) {
    return appReducer({ auth: state.auth } as AppState, action);
  }
  return appReducer(state, action);
};

/** One store per browser tab; created in StoreProvider so the server never shares state. */
export function makeStore() {
  const store = configureStore({ reducer: rootReducer });
  setUnauthorizedHandler(() => store.dispatch(sessionExpired()));
  return store;
}

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
