import type { E2eTest, PreflightCheck, RunSummary, StartRunInput } from './types';

/** The local Playwright runner (e2e/runner/server.ts); its port is E2E_RUNNER_PORT in e2e/.env. */
export const RUNNER_URL = process.env.NEXT_PUBLIC_E2E_RUNNER_URL ?? 'http://127.0.0.1:4140';

/** Thrown when the local runner isn't reachable (not started, wrong port...). */
export class RunnerOfflineError extends Error {}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${RUNNER_URL}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    });
  } catch {
    throw new RunnerOfflineError(`E2E runner is not reachable at ${RUNNER_URL}`);
  }
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.error ?? `Runner responded with ${res.status}`);
  return body as T;
}

export const fetchTests = () => request<{ tests: E2eTest[] }>('/tests').then((r) => r.tests);

export const fetchPreflight = () => request<{ checks: PreflightCheck[] }>('/preflight').then((r) => r.checks);

export const fetchCurrentRun = () => request<RunSummary | null>('/runs/current');

export const startRun = (input: StartRunInput) =>
  request<RunSummary>('/runs', { method: 'POST', body: JSON.stringify(input) });

export const stopRun = (id: string) => request<RunSummary>(`/runs/${id}/stop`, { method: 'POST' });

export const runEventsUrl = (id: string) => `${RUNNER_URL}/runs/${id}/events`;

export const reportUrl = () => `${RUNNER_URL}/report/`;
