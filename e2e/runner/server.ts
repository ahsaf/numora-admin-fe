/**
 * Local test runner for the admin dashboard's "E2E tests" page (app/(portal)/e2e).
 *
 *   GET  /health                is the runner up
 *   GET  /preflight             are the web app, the API and the database reachable
 *   GET  /tests                 list the Playwright tests (from `playwright test --list`)
 *   POST /runs                  start a run: { tests: string[], headed?: boolean, slowMo?: number, browser?: "chrome" | "chromium" }
 *   GET  /runs/current          the latest run (to reattach after a page reload)
 *   GET  /runs/:id/events       Server-Sent Events: replays the run so far, then streams it live
 *   POST /runs/:id/stop         stop a running run
 *   GET  /report/*              the HTML report of the last run
 *
 * Listens on 127.0.0.1 only: it spawns processes, so it must never be reachable from the network.
 * Local use only — it is not part of the admin app's build or deployment.
 */
import { execFile, spawn, type ChildProcess } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { createRequire } from 'node:module';
import path from 'node:path';

import { EVENT_MARKER } from '../reporters/live-reporter';
import { LIVE_API_URL, LIVE_BASE_URL, LIVE_DB } from '../support/env';

const PORT = Number(process.env.E2E_RUNNER_PORT ?? 4140);
const E2E_DIR = path.resolve(__dirname, '..');
const CONFIG_FILE = path.join(E2E_DIR, 'playwright.config.ts');
const TESTS_DIR = path.join(E2E_DIR, 'tests');
const REPORT_DIR = path.join(E2E_DIR, 'playwright-report');
const PLAYWRIGHT_CLI = createRequire(__filename).resolve('@playwright/test/cli');

// ---------- Test catalog ----------

type TestInfo = {
  /** "<file relative to tests/>:<line>" — stable while the file isn't edited above the test. */
  key: string;
  file: string;
  line: number;
  /** describe() titles followed by the test title. */
  titlePath: string[];
  tags: string[];
};

type JsonSpec = { title: string; file: string; line: number; tags: string[] };
type JsonSuite = { title: string; file: string; line: number; specs: JsonSpec[]; suites?: JsonSuite[] };

function collectTests(suite: JsonSuite, parents: string[], out: TestInfo[]) {
  // The top-level suite is the file itself; its title is the file name.
  const titles = suite.line === 0 ? parents : [...parents, suite.title];
  for (const spec of suite.specs) {
    out.push({
      key: `${spec.file}:${spec.line}`,
      file: spec.file,
      line: spec.line,
      titlePath: [...titles, spec.title],
      tags: spec.tags.map((t) => `@${t}`),
    });
  }
  for (const child of suite.suites ?? []) collectTests(child, titles, out);
}

function runPlaywright(args: string[], env: NodeJS.ProcessEnv = {}) {
  return spawn(process.execPath, [PLAYWRIGHT_CLI, 'test', '-c', CONFIG_FILE, ...args], {
    cwd: E2E_DIR,
    env: { ...process.env, FORCE_COLOR: '0', ...env },
  });
}

function listTests(): Promise<TestInfo[]> {
  return new Promise((resolve, reject) => {
    const child = runPlaywright(['--list', '--reporter=json']);
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => (stdout += d));
    child.stderr.on('data', (d) => (stderr += d));
    child.on('error', reject);
    child.on('close', () => {
      try {
        const report = JSON.parse(stdout) as { suites: JsonSuite[]; errors?: { message: string }[] };
        if (report.errors?.length) return reject(new Error(report.errors.map((e) => e.message).join('\n')));
        const tests: TestInfo[] = [];
        for (const suite of report.suites) collectTests(suite, [], tests);
        resolve(tests);
      } catch {
        reject(new Error(stderr || stdout || 'Could not list tests'));
      }
    });
  });
}

// ---------- Preflight ----------

type Check = { name: string; target: string; ok: boolean; detail?: string };

/** Any HTTP answer counts: the API's root may well be a 404, it is still up. */
async function checkHttp(name: string, url: string): Promise<Check> {
  try {
    await fetch(url, { signal: AbortSignal.timeout(3000) });
    return { name, target: url, ok: true };
  } catch (err) {
    return { name, target: url, ok: false, detail: err instanceof Error ? err.message : String(err) };
  }
}

/** The tests read the server's Postgres through `docker exec` (support/db.ts). */
function checkDatabase(): Promise<Check> {
  const check = { name: 'Database', target: `docker: ${LIVE_DB.container}` };
  return new Promise((resolve) => {
    execFile(
      'docker',
      ['exec', LIVE_DB.container, 'psql', '-U', LIVE_DB.user, '-d', LIVE_DB.database, '-tAc', 'SELECT 1'],
      { timeout: 5000 },
      (err, _stdout, stderr) =>
        resolve(err ? { ...check, ok: false, detail: (stderr || err.message).trim() } : { ...check, ok: true }),
    );
  });
}

const preflight = () =>
  Promise.all([checkHttp('Web app', LIVE_BASE_URL), checkHttp('API server', LIVE_API_URL), checkDatabase()]);

// ---------- Runs ----------

type RunEvent = { type: string; [field: string]: unknown };
type RunStatus = 'running' | 'passed' | 'failed' | 'stopped';

type Run = {
  id: string;
  tests: string[];
  status: RunStatus;
  startedAt: number;
  /** Every event so far, replayed to clients that connect mid-run. */
  events: RunEvent[];
  listeners: Set<ServerResponse>;
  child: ChildProcess;
  stopRequested: boolean;
};

let currentRun: Run | null = null;

function publish(run: Run, event: RunEvent) {
  run.events.push(event);
  for (const res of run.listeners) writeSse(res, event);
}

/** Splits a stream into lines: reporter events become structured events, the rest is log output. */
function pipeOutput(run: Run, stream: NodeJS.ReadableStream) {
  let buffer = '';
  stream.on('data', (chunk: Buffer) => {
    buffer += chunk.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (line.startsWith(EVENT_MARKER)) {
        try {
          publish(run, JSON.parse(line.slice(EVENT_MARKER.length)));
          continue;
        } catch {
          // Not valid JSON after all: show it as log output.
        }
      }
      if (line.trim()) publish(run, { type: 'log', text: line });
    }
  });
}

/** Playwright treats each location arg as a regex, so escape the file path. */
const toLocationArg = (test: TestInfo) =>
  `${path.join(TESTS_DIR, test.file).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}:${test.line}`;

type StartRunBody = { tests?: unknown; headed?: unknown; slowMo?: unknown; browser?: unknown };

async function startRun(body: StartRunBody): Promise<Run> {
  if (currentRun?.status === 'running') throw new HttpError(409, 'A run is already in progress');

  // Only accept keys of tests that actually exist: nothing from the request reaches the command line otherwise.
  const requested = Array.isArray(body.tests) ? body.tests.filter((k): k is string => typeof k === 'string') : [];
  const available = await listTests();
  const selected = available.filter((t) => requested.includes(t.key));
  if (selected.length === 0) throw new HttpError(400, 'Select at least one existing test');

  const slowMo = Math.min(Math.max(Number(body.slowMo) || 0, 0), 5000);
  const child = runPlaywright(selected.map(toLocationArg), {
    E2E_LIVE: '1',
    E2E_HEADLESS: body.headed === false ? '1' : '0',
    E2E_SLOW_MO: String(slowMo),
    E2E_BROWSER: body.browser === 'chromium' ? 'chromium' : 'chrome',
  });

  const run: Run = {
    id: randomUUID(),
    tests: selected.map((t) => t.key),
    status: 'running',
    startedAt: Date.now(),
    events: [],
    listeners: new Set(),
    child,
    stopRequested: false,
  };
  currentRun = run;

  publish(run, { type: 'status', status: run.status, tests: run.tests });
  pipeOutput(run, child.stdout!);
  pipeOutput(run, child.stderr!);
  child.on('error', (err) => publish(run, { type: 'log', text: `Failed to start Playwright: ${err.message}` }));
  child.on('close', (code) => {
    run.status = run.stopRequested ? 'stopped' : code === 0 ? 'passed' : 'failed';
    publish(run, { type: 'status', status: run.status, exitCode: code });
    for (const res of run.listeners) res.end();
    run.listeners.clear();
  });
  return run;
}

function stopRun(run: Run) {
  if (run.status !== 'running') return;
  run.stopRequested = true;
  // SIGINT lets Playwright close the browser and still write the report.
  run.child.kill('SIGINT');
}

// ---------- HTTP ----------

class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

const LOCAL_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

function setCors(req: IncomingMessage, res: ServerResponse) {
  const origin = req.headers.origin;
  if (origin && LOCAL_ORIGIN.test(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Vary', 'Origin');
  }
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

function writeSse(res: ServerResponse, event: RunEvent) {
  res.write(`data: ${JSON.stringify(event)}\n\n`);
}

async function readJson(req: IncomingMessage) {
  let raw = '';
  for await (const chunk of req) raw += chunk;
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    throw new HttpError(400, 'Invalid JSON body');
  }
}

const runSummary = (run: Run) => ({ id: run.id, status: run.status, tests: run.tests, startedAt: run.startedAt });

function findRun(id: string) {
  if (currentRun?.id !== id) throw new HttpError(404, 'Run not found');
  return currentRun;
}

const CONTENT_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webm': 'video/webm',
  '.zip': 'application/zip',
  '.txt': 'text/plain; charset=utf-8',
};

function serveReport(res: ServerResponse, subPath: string) {
  const file = path.resolve(REPORT_DIR, decodeURIComponent(subPath) || 'index.html');
  if (!file.startsWith(REPORT_DIR + path.sep) || !existsSync(file) || !statSync(file).isFile()) {
    throw new HttpError(404, 'No report yet — run some tests first');
  }
  res.writeHead(200, { 'Content-Type': CONTENT_TYPES[path.extname(file)] ?? 'application/octet-stream' });
  createReadStream(file).pipe(res);
}

async function handle(req: IncomingMessage, res: ServerResponse) {
  setCors(req, res);
  if (req.method === 'OPTIONS') return void res.writeHead(204).end();

  const { pathname } = new URL(req.url ?? '/', 'http://localhost');
  const route = `${req.method} ${pathname}`;
  let match: RegExpMatchArray | null;

  if (route === 'GET /health') return sendJson(res, 200, { ok: true });

  if (route === 'GET /preflight') return sendJson(res, 200, { checks: await preflight() });

  if (route === 'GET /tests') return sendJson(res, 200, { tests: await listTests() });

  if (route === 'POST /runs') return sendJson(res, 201, runSummary(await startRun(await readJson(req))));

  if (route === 'GET /runs/current') return sendJson(res, 200, currentRun ? runSummary(currentRun) : null);

  if ((match = route.match(/^GET \/runs\/([\w-]+)\/events$/))) {
    const run = findRun(match[1]);
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
    for (const event of run.events) writeSse(res, event);
    if (run.status !== 'running') return void res.end();
    run.listeners.add(res);
    req.on('close', () => run.listeners.delete(res));
    return;
  }

  if ((match = route.match(/^POST \/runs\/([\w-]+)\/stop$/))) {
    const run = findRun(match[1]);
    stopRun(run);
    return sendJson(res, 200, runSummary(run));
  }

  if ((match = route.match(/^GET \/report(?:\/(.*))?$/))) {
    // Redirect /report to /report/ so the report's relative asset URLs resolve.
    if (match[1] === undefined) return void res.writeHead(302, { Location: '/report/' }).end();
    return serveReport(res, match[1]);
  }

  throw new HttpError(404, 'Not found');
}

const server = createServer((req, res) => {
  handle(req, res).catch((err: unknown) => {
    const status = err instanceof HttpError ? err.status : 500;
    const message = err instanceof Error ? err.message : String(err);
    if (status === 500) console.error(err);
    if (!res.headersSent) sendJson(res, status, { error: message });
    else res.end();
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`E2E runner listening on http://127.0.0.1:${PORT}`);
});

// Don't leave a browser window behind when the runner is stopped (Ctrl+C).
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    if (currentRun) stopRun(currentRun);
    server.close();
    process.exit(0);
  });
}
