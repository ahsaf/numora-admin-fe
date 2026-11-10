import axios from 'axios';
import { ENV } from '@/config/env';

/**
 * The admin session is an httpOnly cookie set by the server on login; page JS can't
 * read it. `withCredentials` makes the browser send it with every request.
 */
export const api = axios.create({
  baseURL: ENV.apiUrl,
  withCredentials: true,
  timeout: 20_000,
});

let onUnauthorized: (() => void) | undefined;

/** Registered by the store, so a 401 from any call ends the session without a circular import. */
export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      onUnauthorized?.();
    }
    return Promise.reject(error);
  },
);

export function getErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (axios.isAxiosError<{ message?: string | string[] }>(error)) {
    const message = error.response?.data?.message;
    if (Array.isArray(message)) return message[0] ?? fallback;
    if (message) return message;
    if (!error.response) return 'Cannot reach the server. Check your connection.';
    return error.message || fallback;
  }
  return error instanceof Error ? error.message : fallback;
}

/** Turns a server path like `/uploads/logos/x.png` into a full URL. */
export const getFileUrl = (path?: string | null) => (path ? `${ENV.apiUrl}${path}` : undefined);
