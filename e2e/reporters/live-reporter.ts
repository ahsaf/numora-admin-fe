import path from 'node:path';

import type {
  Suite,
  TestCase,
  TestStep,
  Reporter,
  FullConfig,
  FullResult,
  TestResult,
} from '@playwright/test/reporter';

/** Lines starting with this marker carry a JSON event; the runner parses them, everything else is plain log. */
export const EVENT_MARKER = '__E2E_EVENT__';

/** Browser calls (goto, click, fill...) and assertions: shown as the step's current action. */
const ACTION_CATEGORIES = new Set(['pw:api', 'expect']);

/**
 * Streams run progress as JSON lines on stdout so the dashboard can show a live timeline:
 * each `test.step` as a business step, and the browser action running inside it.
 * Enabled by the runner via E2E_LIVE=1 (see playwright.config.ts).
 */
export default class LiveReporter implements Reporter {
  private rootDir = '';

  private emit(event: Record<string, unknown>) {
    process.stdout.write(`${EVENT_MARKER}${JSON.stringify(event)}\n`);
  }

  /** Same key the runner uses to select tests: "<file relative to testDir>:<line>". */
  private key(test: TestCase) {
    return `${path.relative(this.rootDir, test.location.file)}:${test.location.line}`;
  }

  printsToStdio() {
    // The "list" reporter already prints human-readable output.
    return false;
  }

  onBegin(config: FullConfig, suite: Suite) {
    this.rootDir = config.projects[0]?.testDir ?? config.rootDir;
    this.emit({ type: 'begin', total: suite.allTests().length });
  }

  onTestBegin(test: TestCase) {
    this.emit({ type: 'testBegin', key: this.key(test), title: test.title });
  }

  onStepBegin(test: TestCase, _result: TestResult, step: TestStep) {
    if (step.category === 'test.step') {
      this.emit({ type: 'stepBegin', key: this.key(test), title: step.title });
    } else if (ACTION_CATEGORIES.has(step.category)) {
      this.emit({ type: 'action', key: this.key(test), title: step.title });
    }
  }

  onStepEnd(test: TestCase, _result: TestResult, step: TestStep) {
    if (step.category !== 'test.step') return;
    this.emit({
      type: 'stepEnd',
      key: this.key(test),
      title: step.title,
      duration: step.duration,
      error: step.error?.message,
    });
  }

  onTestEnd(test: TestCase, result: TestResult) {
    this.emit({
      type: 'testEnd',
      key: this.key(test),
      status: result.status,
      duration: result.duration,
      error: result.error?.message,
    });
  }

  onEnd(result: FullResult) {
    this.emit({ type: 'end', status: result.status, duration: result.duration });
  }
}
