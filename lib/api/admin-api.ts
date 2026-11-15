import { api } from './client';
import type {
  ActivateSubscriptionInput,
  AdminProfile,
  ApiResponse,
  BlockedUser,
  CompanyDetail,
  CompanyListResponse,
  CompanySubscription,
  CompanyType,
  CompanyTypeInput,
  CompanyTypeOptions,
  CompanyStatusFilter,
  CompanyUser,
  Dashboard,
  ListQuery,
  PaginatedResponse,
  Plan,
  PlanInput,
  PlatformSettings,
  SubscriptionPeriod,
  SubscriptionRequest,
  SubscriptionRequestFilter,
  SubscriptionRequestListResponse,
  SubscriptionRequestStatus,
} from './types';

/** Drops empty values so the URL stays clean. */
const toParams = (query: ListQuery & Record<string, unknown>) =>
  Object.fromEntries(Object.entries(query).filter(([, v]) => v !== '' && v != null));

export const authApi = {
  login: (body: { email: string; password: string }) =>
    api.post<ApiResponse<AdminProfile>>('/admin/auth/login', body).then((r) => r.data),
  me: () => api.get<ApiResponse<AdminProfile>>('/admin/auth/me').then((r) => r.data),
  logout: () => api.post<ApiResponse<null>>('/admin/auth/logout').then((r) => r.data),
  changePassword: (body: { currentPassword: string; newPassword: string }) =>
    api.patch<ApiResponse<number>>('/admin/auth/changePassword', body).then((r) => r.data),
};

export const dashboardApi = {
  get: () => api.get<ApiResponse<Dashboard>>('/admin/dashboard').then((r) => r.data),
};

export const companiesApi = {
  list: (query: ListQuery & { status: CompanyStatusFilter }) =>
    api
      .get<CompanyListResponse>('/admin/companies', { params: toParams(query) })
      .then((r) => r.data),
  get: (id: number) =>
    api.get<ApiResponse<CompanyDetail>>(`/admin/companies/${id}`).then((r) => r.data),
  setStatus: (id: number, isActive: boolean) =>
    api.patch<ApiResponse<{ id: number; isActive: boolean }>>(`/admin/companies/${id}/status`, { isActive }).then((r) => r.data),
  users: (id: number, query: ListQuery) =>
    api
      .get<PaginatedResponse<CompanyUser>>(`/admin/companies/${id}/users`, { params: toParams(query) })
      .then((r) => r.data),
  setUserStatus: (companyId: number, userId: number, isActive: boolean) =>
    api
      .patch<ApiResponse<{ companyId: number; userId: number; isActive: boolean }>>(
        `/admin/companies/${companyId}/users/${userId}/status`,
        { isActive },
      )
      .then((r) => r.data),
};

export const usersApi = {
  blocked: (query: ListQuery) =>
    api
      .get<PaginatedResponse<BlockedUser>>('/admin/users/blocked', { params: toParams(query) })
      .then((r) => r.data),
  setBlocked: (id: number, blocked: boolean) =>
    api.patch<ApiResponse<{ id: number; blocked: boolean }>>(`/admin/users/${id}/block`, { blocked }).then((r) => r.data),
};

export const plansApi = {
  list: () => api.get<ApiResponse<Plan[]>>('/admin/plans').then((r) => r.data),
  create: (body: PlanInput) => api.post<ApiResponse<Plan>>('/admin/plans', body).then((r) => r.data),
  update: (id: number, body: PlanInput) => api.patch<ApiResponse<Plan>>(`/admin/plans/${id}`, body).then((r) => r.data),
  remove: (id: number) => api.delete<ApiResponse<number>>(`/admin/plans/${id}`).then((r) => r.data),
};

export const companyTypesApi = {
  list: () => api.get<ApiResponse<CompanyType[]>>('/admin/company-types').then((r) => r.data),
  options: () => api.get<ApiResponse<CompanyTypeOptions>>('/admin/company-types/options').then((r) => r.data),
  create: (body: CompanyTypeInput) =>
    api.post<ApiResponse<CompanyType>>('/admin/company-types', body).then((r) => r.data),
  update: (id: number, body: CompanyTypeInput) =>
    api.patch<ApiResponse<CompanyType>>(`/admin/company-types/${id}`, body).then((r) => r.data),
  remove: (id: number) => api.delete<ApiResponse<number>>(`/admin/company-types/${id}`).then((r) => r.data),
};

export const subscriptionsApi = {
  get: (companyId: number) =>
    api.get<ApiResponse<CompanySubscription>>(`/admin/companies/${companyId}/subscription`).then((r) => r.data),
  activate: (companyId: number, body: ActivateSubscriptionInput) =>
    api
      .post<ApiResponse<SubscriptionPeriod>>(`/admin/companies/${companyId}/subscription`, body)
      .then((r) => r.data),
  cancel: (companyId: number, subscriptionId: number) =>
    api
      .post<ApiResponse<SubscriptionPeriod>>(`/admin/companies/${companyId}/subscription/${subscriptionId}/cancel`)
      .then((r) => r.data),
};

export const subscriptionRequestsApi = {
  list: (query: { page: number; limit: number; status: SubscriptionRequestFilter }) =>
    api
      .get<SubscriptionRequestListResponse>('/admin/subscription-requests', { params: query })
      .then((r) => r.data),
  setStatus: (id: number, status: SubscriptionRequestStatus.handled | SubscriptionRequestStatus.dismissed) =>
    api
      .patch<ApiResponse<SubscriptionRequest>>(`/admin/subscription-requests/${id}`, { status })
      .then((r) => r.data),
};

export const settingsApi = {
  get: () => api.get<ApiResponse<PlatformSettings>>('/admin/settings').then((r) => r.data),
  update: (body: Partial<PlatformSettings>) =>
    api.put<ApiResponse<PlatformSettings>>('/admin/settings', body).then((r) => r.data),
};
