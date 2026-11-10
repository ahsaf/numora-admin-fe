/** A Playwright test as listed by the local runner (e2e/runner/server.ts). */
export type E2eTest = {
  /** "<file>:<line>" — what the runner expects when starting a run. */
  key: string;
  file: string;
  line: number;
  titlePath: string[];
  tags: string[];
};

/** Whether something the tests need is up (GET /preflight). */
export type PreflightCheck = { name: string; target: string; ok: boolean; detail?: string };

export type E2eBrowser = 'chrome' | 'chromium';

export type StartRunInput = {
  tests: string[];
  headed: boolean;
  slowMo: number;
  browser: E2eBrowser;
};

export type RunStatus = 'running' | 'passed' | 'failed' | 'stopped';

export type RunSummary = {
  id: string;
  status: RunStatus;
  tests: string[];
  startedAt: number;
};

export type TestStatus = 'queued' | 'running' | 'passed' | 'failed' | 'timedOut' | 'skipped' | 'interrupted';

/** Events streamed by the runner; most come from e2e/reporters/live-reporter.ts. */
export type RunEvent =
  | { type: 'status'; status: RunStatus; tests?: string[]; exitCode?: number | null }
  | { type: 'log'; text: string }
  | { type: 'begin'; total: number }
  | { type: 'testBegin'; key: string; title: string }
  | { type: 'stepBegin'; key: string; title: string }
  | { type: 'stepEnd'; key: string; title: string; duration: number; error?: string }
  | { type: 'action'; key: string; title: string }
  | { type: 'testEnd'; key: string; status: TestStatus; duration: number; error?: string }
  | { type: 'end'; status: string; duration: number };

/** One `test.step` of a spec (a business step such as "9. add a bank account"). */
export type StepState = { title: string; done: boolean; duration?: number; error?: string };

export type TestRunState = {
  status: TestStatus;
  steps: StepState[];
  /** The browser action (click, fill, expect...) running right now. */
  currentAction?: string;
  duration?: number;
  error?: string;
};

export type RunState = {
  status: RunStatus;
  tests: Record<string, TestRunState>;
  logs: string[];
};
