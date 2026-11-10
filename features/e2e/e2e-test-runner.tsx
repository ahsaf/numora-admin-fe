'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  CheckIcon,
  CircleDashedIcon,
  EmptyState,
  ExternalLinkIcon,
  FlaskIcon,
  PageHeader,
  PlayIcon,
  RefreshIcon,
  SearchInput,
  Segmented,
  Skeleton,
  Spinner,
  StopIcon,
  XIcon,
  type BadgeTone,
} from '@/components/ui';
import { cn } from '@/lib/cn';
import { useAppDispatch } from '@/store/hooks';
import { notify } from '@/store/slices/ui-slice';
import { RUNNER_URL, RunnerOfflineError, reportUrl, startRun, stopRun } from './api';
import { useCurrentRun, useE2eTests, usePreflight, useRunEvents } from './hooks';
import type { E2eBrowser, E2eTest, PreflightCheck, RunStatus, TestRunState, TestStatus } from './types';

const SPEEDS = [
  { value: '0', label: 'Full speed' },
  { value: '300', label: 'Slow' },
  { value: '1000', label: 'Very slow' },
] as const;

type Speed = (typeof SPEEDS)[number]['value'];

const BROWSERS: { value: E2eBrowser; label: string }[] = [
  { value: 'chrome', label: 'Chrome' },
  { value: 'chromium', label: 'Chromium' },
];

const RUN_BADGE: Record<RunStatus, { label: string; tone: BadgeTone }> = {
  running: { label: 'Running', tone: 'info' },
  passed: { label: 'Passed', tone: 'success' },
  failed: { label: 'Failed', tone: 'danger' },
  stopped: { label: 'Stopped', tone: 'warning' },
};

const formatDuration = (ms?: number) =>
  ms === undefined ? '' : ms < 1000 ? `${Math.round(ms)} ms` : ms < 60_000 ? `${(ms / 1000).toFixed(1)} s` : `${Math.floor(ms / 60_000)}m ${Math.round((ms % 60_000) / 1000)}s`;

const errorMessage = (err: unknown) => (err instanceof Error ? err.message : String(err));

export function E2eTestRunner() {
  const dispatch = useAppDispatch();
  const tests = useE2eTests();
  const preflight = usePreflight();
  const { run: currentRun, setRun } = useCurrentRun();
  const run = useRunEvents(currentRun?.id);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [headed, setHeaded] = useState(true);
  const [speed, setSpeed] = useState<Speed>('0');
  const [browser, setBrowser] = useState<E2eBrowser>('chrome');
  const [busy, setBusy] = useState(false);

  const running = run?.status === 'running';

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tests.data.filter((t) => !q || [...t.titlePath, t.file, ...t.tags].some((v) => v.toLowerCase().includes(q)));
  }, [tests.data, search]);

  const byFile = useMemo(() => Map.groupBy(filtered, (t) => t.file), [filtered]);

  // Ignore keys of tests that disappeared after a refresh.
  const selectedKeys = tests.data.filter((t) => selected.has(t.key)).map((t) => t.key);

  const toggle = (keys: string[], checked: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      for (const key of keys) {
        if (checked) next.add(key);
        else next.delete(key);
      }
      return next;
    });

  const fail = (err: unknown) => dispatch(notify('error', errorMessage(err)));

  const onRun = async () => {
    setBusy(true);
    try {
      setRun(await startRun({ tests: selectedKeys, headed, slowMo: Number(speed), browser }));
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  };

  const onStop = async () => {
    if (!currentRun) return;
    setBusy(true);
    try {
      await stopRun(currentRun.id);
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  };

  const titleOf = (key: string) => tests.data.find((t) => t.key === key)?.titlePath.join(' › ') ?? key;
  const offline = tests.error instanceof RunnerOfflineError;
  const preflightFailed = preflight.data.some((c) => !c.ok);

  return (
    <>
      <PageHeader
        title="E2E tests"
        description="Regression run of the whole Numora app: Playwright drives the web app against the real server and database on this machine."
        eyebrow={<Badge tone="warning">Local only</Badge>}
        actions={
          <>
            <a
              href={reportUrl()}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-line-strong bg-surface px-3.5 text-sm font-medium text-fg shadow-sm hover:bg-subtle"
            >
              <ExternalLinkIcon size={16} />
              Last report
            </a>
            {running ? (
              <Button variant="danger" icon={<StopIcon size={16} />} onClick={onStop} loading={busy}>
                Stop
              </Button>
            ) : (
              <Button
                icon={<PlayIcon size={16} />}
                onClick={onRun}
                loading={busy}
                disabled={selectedKeys.length === 0 || offline}
              >
                Run{selectedKeys.length > 0 && ` (${selectedKeys.length})`}
              </Button>
            )}
          </>
        }
      />

      {offline ? (
        <Card>
          <EmptyState
            icon={<FlaskIcon size={22} />}
            title="The local E2E runner isn't running"
            description={
              <>
                Start the admin with <Code>yarn dev:e2e</Code>, or run <Code>yarn e2e:runner</Code> in another terminal.
                First time: <Code>yarn e2e:install</Code>. Expected at <Code>{RUNNER_URL}</Code>.
              </>
            }
            action={
              <Button variant="secondary" icon={<RefreshIcon size={16} />} loading={tests.loading} onClick={() => { tests.reload(); preflight.reload(); }}>
                Retry
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <div className="flex min-w-0 flex-col gap-6">
            <Card>
              <CardHeader
                title="Services"
                description="What the tests need running on this machine."
                action={
                  <Button variant="ghost" size="sm" icon={<RefreshIcon size={14} />} loading={preflight.loading} onClick={preflight.reload}>
                    Check
                  </Button>
                }
              />
              <CardBody className="flex flex-col gap-3">
                {preflight.data.length === 0 && preflight.loading ? (
                  <Skeleton className="h-16 w-full" />
                ) : (
                  preflight.data.map((check) => <PreflightRow key={check.name} check={check} />)
                )}
                {preflightFailed && (
                  <p className="text-xs text-fg-muted">
                    Start them first: in thesuperappserver <Code>docker compose up -d</Code> and <Code>yarn start:dev</Code>, in
                    thesuperappweb <Code>yarn dev</Code>.
                  </p>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader
                title="Tests"
                description="From e2e/tests — add a spec there and refresh."
                action={
                  <Button variant="ghost" size="sm" icon={<RefreshIcon size={14} />} loading={tests.loading} onClick={tests.reload}>
                    Refresh
                  </Button>
                }
              />
              <CardBody className="flex flex-col gap-4">
                {tests.error ? (
                  <pre className="overflow-x-auto rounded-lg bg-danger-50 p-3 text-xs whitespace-pre-wrap text-danger-700">
                    {tests.error.message}
                  </pre>
                ) : (
                  <>
                    <SearchInput value={search} onChange={setSearch} placeholder="Search title, file or @tag" />
                    {tests.loading && tests.data.length === 0 ? (
                      <div className="flex flex-col gap-2">
                        <Skeleton className="h-5 w-full" />
                        <Skeleton className="h-5 w-4/5" />
                      </div>
                    ) : filtered.length === 0 ? (
                      <p className="text-sm text-fg-muted">No tests found.</p>
                    ) : (
                      <div className="flex flex-col gap-4">
                        <CheckRow
                          checked={filtered.every((t) => selected.has(t.key))}
                          onChange={(c) => toggle(filtered.map((t) => t.key), c)}
                        >
                          <span className="font-medium">Select all ({filtered.length})</span>
                        </CheckRow>
                        {[...byFile].map(([file, fileTests]) => (
                          <TestFile key={file} file={file} tests={fileTests} selected={selected} toggle={toggle} />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Options" />
              <CardBody className="flex flex-col gap-4">
                <CheckRow checked={headed} onChange={setHeaded}>
                  Show browser
                  <span className="block text-xs text-fg-muted">Opens a window so you can watch each step.</span>
                </CheckRow>
                <OptionRow label="Speed">
                  <Segmented ariaLabel="Speed" options={[...SPEEDS]} value={speed} onChange={setSpeed} />
                </OptionRow>
                <OptionRow label="Browser" hint="Chromium needs `npx playwright install chromium` in e2e/ once.">
                  <Segmented ariaLabel="Browser" options={BROWSERS} value={browser} onChange={setBrowser} />
                </OptionRow>
              </CardBody>
            </Card>
          </div>

          <Card className="min-w-0 self-start">
            <CardHeader
              title={
                <span className="flex items-center gap-2">
                  Run
                  {run && (
                    <Badge tone={RUN_BADGE[run.status].tone} dot>
                      {RUN_BADGE[run.status].label}
                    </Badge>
                  )}
                </span>
              }
              description={currentRun ? `Started ${new Date(currentRun.startedAt).toLocaleTimeString()}` : 'No run yet.'}
            />
            <CardBody className="flex flex-col gap-4">
              {run ? (
                <>
                  <ol className="flex flex-col gap-3">
                    {Object.entries(run.tests).map(([key, test]) => (
                      <TestResult key={key} title={titleOf(key)} test={test} />
                    ))}
                  </ol>
                  <RunLog lines={run.logs} />
                </>
              ) : (
                <EmptyState
                  icon={<PlayIcon size={20} />}
                  title="Pick a test and press Run"
                  description="Each business step shows up here as it runs, with the browser action in progress."
                />
              )}
            </CardBody>
          </Card>
        </div>
      )}
    </>
  );
}

// ---------- Parts ----------

function Code({ children }: { children: React.ReactNode }) {
  return <code className="rounded bg-subtle px-1 py-0.5 font-mono text-[0.85em] text-fg">{children}</code>;
}

function CheckRow({
  checked,
  onChange,
  children,
  className,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn('flex cursor-pointer items-start gap-2.5 text-sm text-fg', className)}>
      <input
        type="checkbox"
        className="mt-0.5 size-4 shrink-0 cursor-pointer accent-brand-600"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="min-w-0">{children}</span>
    </label>
  );
}

function OptionRow({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-fg">{label}</span>
      {children}
      {hint && <span className="text-xs text-fg-subtle">{hint}</span>}
    </div>
  );
}

function PreflightRow({ check }: { check: PreflightCheck }) {
  return (
    <div className="flex items-start gap-3 text-sm">
      <span
        className={cn(
          'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full',
          check.ok ? 'bg-success-50 text-success-600' : 'bg-danger-50 text-danger-600',
        )}
      >
        {check.ok ? <CheckIcon size={12} strokeWidth={3} /> : <XIcon size={12} strokeWidth={3} />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-fg">{check.name}</p>
        <p className="truncate font-mono text-xs text-fg-muted">{check.target}</p>
        {check.detail && <p className="mt-0.5 text-xs wrap-break-word text-danger-700">{check.detail}</p>}
      </div>
    </div>
  );
}

function TestFile({
  file,
  tests,
  selected,
  toggle,
}: {
  file: string;
  tests: E2eTest[];
  selected: Set<string>;
  toggle: (keys: string[], checked: boolean) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <CheckRow checked={tests.every((t) => selected.has(t.key))} onChange={(c) => toggle(tests.map((t) => t.key), c)}>
        <span className="font-mono text-xs text-fg-muted">{file}</span>
      </CheckRow>
      <ul className="ml-6 flex flex-col gap-2">
        {tests.map((t) => (
          <li key={t.key}>
            <CheckRow checked={selected.has(t.key)} onChange={(c) => toggle([t.key], c)}>
              <span className="flex flex-wrap items-center gap-1.5">
                {t.titlePath.join(' › ')}
                {t.tags.map((tag) => (
                  <Badge key={tag}>{tag}</Badge>
                ))}
              </span>
            </CheckRow>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TestStatusIcon({ status, size = 16 }: { status: TestStatus; size?: number }) {
  if (status === 'running') return <Spinner size={size - 2} className="text-brand-500" />;
  if (status === 'passed') return <CheckIcon size={size} className="text-success-600" />;
  if (status === 'queued' || status === 'skipped') return <CircleDashedIcon size={size} className="text-fg-subtle" />;
  return <XIcon size={size} className="text-danger-600" />;
}

function TestResult({ title, test }: { title: string; test: TestRunState }) {
  const done = test.steps.filter((s) => s.done && !s.error).length;
  return (
    <li className="rounded-lg border border-line">
      <details open={test.status === 'running' || test.status === 'failed' || test.status === 'timedOut' || undefined}>
        <summary className="flex cursor-pointer list-none items-center gap-2.5 px-3.5 py-3 text-sm">
          <TestStatusIcon status={test.status} />
          <span className="min-w-0 flex-1 font-medium text-fg">{title}</span>
          {test.steps.length > 0 && (
            <span className="tabular text-xs text-fg-muted">
              {done}/{test.steps.length} steps
            </span>
          )}
          <span className="tabular text-xs text-fg-subtle">{formatDuration(test.duration)}</span>
        </summary>
        {test.steps.length > 0 && (
          <ol className="flex flex-col gap-1 border-t border-line px-3.5 py-3 text-xs">
            {test.steps.map((step, i) => (
              <li key={i}>
                <div className="flex items-center gap-2">
                  {!step.done ? (
                    <Spinner size={11} className="text-brand-500" />
                  ) : step.error ? (
                    <XIcon size={13} className="text-danger-600" />
                  ) : (
                    <CheckIcon size={13} className="text-success-600" />
                  )}
                  <span className={cn('min-w-0 flex-1', step.done ? 'text-fg-muted' : 'font-medium text-fg')}>{step.title}</span>
                  <span className="tabular text-fg-subtle">{formatDuration(step.duration)}</span>
                </div>
                {!step.done && test.currentAction && (
                  <p className="mt-0.5 ml-5 truncate font-mono text-[11px] text-fg-subtle">{test.currentAction}</p>
                )}
              </li>
            ))}
          </ol>
        )}
        {test.error && (
          <pre className="mx-3.5 mb-3 overflow-x-auto rounded-lg bg-danger-50 p-3 text-xs whitespace-pre-wrap text-danger-700">
            {test.error}
          </pre>
        )}
      </details>
    </li>
  );
}

function RunLog({ lines }: { lines: string[] }) {
  const ref = useRef<HTMLPreElement>(null);

  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight });
  }, [lines.length]);

  return (
    <details>
      <summary className="cursor-pointer text-sm text-fg-muted">Console output ({lines.length})</summary>
      <pre ref={ref} className="mt-2 max-h-72 overflow-auto rounded-lg bg-nav p-3 font-mono text-xs text-nav-fg">
        {lines.join('\n') || 'No output yet.'}
      </pre>
    </details>
  );
}
