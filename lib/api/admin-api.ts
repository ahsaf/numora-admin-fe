import { api } from './client';
import type {
  AdminProfile,
  ApiResponse,
  BlockedUser,
  CompanyDetail,
  CompanyListResponse,
  CompanyStatusFilter,
  CompanyUser,
  Dashboard,
  ListQuery,
  PaginatedResponse,
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
