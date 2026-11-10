# E2E regression tests (Playwright) — local only

End-to-end tests of the whole Numora app: the real web app (thesuperappweb) against the real
thesuperappserver and its Postgres, nothing mocked. Run them from the admin's **Developer → E2E tests**
page (or the terminal) after a change, to confirm every journey still works.

## Local only, never deployed

- `e2e/` is its own package (`e2e/package.json`, `e2e/node_modules`). Playwright, tsx and concurrently are
  **not** in the admin's root `package.json`, so installing the admin on the droplet never installs them.
- The root `tsconfig.json` and ESLint ignore `e2e/`, so `next build` never compiles it.
- The page is `app/(portal)/e2e/page.dev.tsx`: `next.config.ts` only accepts `.dev.tsx` pages under
  `next dev`. A production build has no `/e2e` route (404) and doesn't bundle the runner UI; the
  sidebar item is dropped too (`process.env.NODE_ENV === 'development'` in `config/navigation.tsx`).
- The runner listens on `127.0.0.1` only.

## Before a run

| Where | Command |
| --- | --- |
| thesuperappserver | `docker compose up -d` and `yarn start:dev` (API on :3000) |
| thesuperappweb | `yarn dev` (web app on :3039 — the origin the server's CORS allows) |
| numora-admin, first time | `yarn e2e:install` (Google Chrome must be installed) |

The **Services** card on the page checks all three (web app, API, database) before you run.

## Run

| Command (from numora-admin) | What it does |
| --- | --- |
| `yarn dev:e2e` | Admin (`next dev` on :3040) + runner (:4140). Open `/e2e`, tick tests, Run. |
| `yarn e2e:runner` | Runner only, when `yarn dev` is already running. |
| `yarn e2e` | Run every test in the terminal (headed). `E2E_HEADLESS=1 yarn e2e` for no window. |
| `yarn e2e:report` | Open the last HTML report (traces, screenshots, video on failure). |
| `yarn --cwd e2e tsc` | Type-check the tests. |

Each run registers new users (`e2e.*@example.com`) and a new company in the local database.

## Layout

```
e2e/
  playwright.config.ts      target, headed/slow-mo, browser, timeouts, reports
  tests/                    the specs — short, one test.step per business step
    business-flow.spec.ts   whole journey: sign-up → company → roles → catalog → billing →
                            payments → transactions → dashboard → reports → collection agent
  actions/                  reusable steps, one file per module of the app
    auth.ts                 register, verify email, sign in/out, set up company, accept invite
    navigation.ts           sidebar, Administration tiles, sidebar/permission checks
    administration.ts       roles, user invites, categories
    catalog.ts              products and services
    customers.ts            create/complete customer, bills, payments, balance checks
    invoices.ts             customer invoices (pay now / later)
    bank-accounts.ts        bank and cash accounts, balance checks
    transactions.ts         expense, transfer, cash deposit
    dashboard.ts            dashboard widgets
    reports.ts              collection / transaction / expense reports
  support/
    env.ts                  URLs and DB container (overridable in e2e/.env)
    db.ts                   psql through `docker exec` (e.g. issue an email-verify token)
    ledger.ts               what every balance/total should be, updated with each step
    format.ts               copy of the web app's number formatting (keep in sync)
    ui.ts                   MUI helpers: selects, multi-selects, dialogs
  reporters/live-reporter.ts  streams progress to the dashboard
  runner/server.ts          local API the dashboard talks to (127.0.0.1:4140)
```

## Add a test

Create `e2e/tests/<journey>.spec.ts` built from `actions/`, then press **Refresh** on the page — it shows up.
Wrap each business step in `test.step('…', …)`: the dashboard lists them live with timings, and the browser
action in progress. New screens get their own file in `actions/`. Prefer `getByTestId` / `getByRole`.

## Config

Copy `e2e/.env.example` to `e2e/.env` to change URLs, the DB container or the runner port. If you change the
runner port, set `NEXT_PUBLIC_E2E_RUNNER_URL` in the admin's `.env.local` too.
