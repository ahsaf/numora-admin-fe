'use client';

import { useCallback, useEffect, useReducer, useState } from 'react';
import { fetchCurrentRun, fetchPreflight, fetchTests, runEventsUrl } from './api';
import type { E2eTest, PreflightCheck, RunEvent, RunState, RunSummary, TestRunState } from './types';

type Loadable<T> = { data: T; loading: boolean; error: Error | null };

/** Loads `load` on mount and whenever `reload` is called; keeps the last data while reloading. */
function useLoad<T>(load: () => Promise<T>, initial: T) {
  const [state, setState] = useState<Loadable<T>>({ data: initial, loading: true, error: null });

  const reload = useCallback(() => {
    setState((s) => ({ ...s, loading: true }));
    return load().then(
      (data) => setState({ data, loading: false, error: null }),
      (error: Error) => setState((s) => ({ ...s, loading: false, error })),
    );
  }, [load]);

  useEffect(() => {
    // Subscribing to an external system (the local runner); the state updates arrive asynchronously.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    reload();
  }, [reload]);

  return { ...state, reload };
}

const NO_TESTS: E2eTest[] = [];
const NO_CHECKS: PreflightCheck[] = [];

/** The specs under e2e/tests, as Playwright lists them. */
export const useE2eTests = () => useLoad(fetchTests, NO_TESTS);

/** Web app, API and database reachability. */
export const usePreflight = () => useLoad(fetchPreflight, NO_CHECKS);

/** The runner's latest run, so a page reload reattaches to a run in progress. */
export function useCurrentRun() {
  const loaded = useLoad(fetchCurrentRun, null);
  const [started, setStarted] = useState<RunSummary | null>(null);
  // A run started from this page wins over what was loaded before it.
  return { run: started ?? loaded.data, setRun: setStarted };
}

// ---------- Live run state ----------

const MAX_LOG_LINES = 1000;

const emptyTest = (): TestRunState => ({ status: 'queued', steps: [] });

function updateTest(state: RunState, key: string, update: (test: TestRunState) => TestRunState): RunState {
  return { ...state, tests: { ...state.tests, [key]: update(state.tests[key] ?? emptyTest()) } };
}

function runReducer(state: RunState | null, event: RunEvent | { type: 'reset' }): RunState | null {
  if (event.type === 'reset') return null;
  // A run's first event lists its tests; it also comes first when the stream replays after a reconnect.
  if (event.type === 'status' && event.tests) {
    return { status: event.status, tests: Object.fromEntries(event.tests.map((k) => [k, emptyTest()])), logs: [] };
  }
  if (!state) return state;

  switch (event.type) {
    case 'status':
      return { ...state, status: event.status };
    case 'log':
      return { ...state, logs: [...state.logs.slice(-MAX_LOG_LINES + 1), event.text] };
    case 'testBegin':
      return updateTest(state, event.key, () => ({ status: 'running', steps: [] }));
    case 'stepBegin':
      return updateTest(state, event.key, (t) => ({
        ...t,
        currentAction: undefined,
        steps: [...t.steps, { title: event.title, done: false }],
      }));
    case 'action':
      return updateTest(state, event.key, (t) => ({ ...t, currentAction: event.title }));
    case 'stepEnd':
      return updateTest(state, event.key, (t) => {
        // Close the most recent open step with this title (steps can nest).
        const index = t.steps.findLastIndex((s) => !s.done && s.title === event.title);
        if (index === -1) return t;
        const steps = [...t.steps];
        steps[index] = { ...steps[index], done: true, duration: event.duration, error: event.error };
        return { ...t, steps };
      });
    case 'testEnd':
      return updateTest(state, event.key, (t) => ({
        ...t,
        status: event.status,
        duration: event.duration,
        error: event.error,
        currentAction: undefined,
      }));
    default:
      return state;
  }
}

/** Follows a run's event stream and folds it into per-test progress. */
export function useRunEvents(runId: string | undefined) {
  const [state, dispatch] = useReducer(runReducer, null);

  useEffect(() => {
    dispatch({ type: 'reset' });
    if (!runId) return;

    const source = new EventSource(runEventsUrl(runId));
    source.onmessage = (message) => {
      const event = JSON.parse(message.data) as RunEvent;
      dispatch(event);
      // The runner ends the stream once the run finishes; close so EventSource doesn't reconnect and replay it.
      if (event.type === 'status' && event.status !== 'running') source.close();
    };
    return () => source.close();
  }, [runId]);

  return state;
}
