'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import {
  Alert,
  Avatar,
  Badge,
  BuildingIcon,
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  PageHeader,
  ReceiptIcon,
  RefreshIcon,
  Skeleton,
  SparkIcon,
  StatCard,
  StatusBadge,
  TrendingUpIcon,
  UsersIcon,
} from '@/components/ui';
import { cn } from '@/lib/cn';
import { formatMoney, formatNumber, formatRelative, percent } from '@/lib/format';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setCompaniesQuery } from '@/store/slices/companies-slice';
import { fetchDashboard } from '@/store/slices/dashboard-slice';
import { MonthBars } from './month-bars';

/** Data older than this is refetched when the page is opened again. */
const STALE_MS = 60_000;

function Row({
  label,
  value,
  hint,
  href,
  onNavigate,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  href?: string;
  onNavigate?: () => void;
}) {
  const content = (
    <>
      <div className="min-w-0">
        <p className="text-sm text-fg">{label}</p>
        {hint && <p className="text-xs text-fg-subtle">{hint}</p>}
      </div>
      <span className="tabular text-sm font-semibold text-fg">{value}</span>
    </>
  );
  return href ? (
    <Link href={href} onClick={onNavigate} className="-mx-2 flex items-center justify-between gap-3 rounded-md px-2 py-2.5 hover:bg-subtle">
      {content}
    </Link>
  ) : (
    <div className="flex items-center justify-between gap-3 py-2.5">{content}</div>
  );
}

export function DashboardView() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { data, loading, error, loadedAt } = useAppSelector((s) => s.dashboard);

  useEffect(() => {
    if (!loadedAt || Date.now() - loadedAt > STALE_MS) dispatch(fetchDashboard());
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on mount
  }, [dispatch]);

  const first = loading && !data;
  const c = data?.companies;
  const u = data?.users;
  const usage = data?.usage;

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="How the Numora platform is doing right now."
        actions={
          <Button variant="secondary" icon={<RefreshIcon size={15} />} loading={loading && !!data} onClick={() => dispatch(fetchDashboard())}>
            Refresh
          </Button>
        }
      />

      {error && (
        <Alert className="mb-6" action={<Button size="sm" variant="secondary" onClick={() => dispatch(fetchDashboard())}>Retry</Button>}>
          {error}
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total companies"
          icon={<BuildingIcon size={18} />}
          loading={first}
          value={formatNumber(c?.total ?? 0)}
          hint={<span className="text-success-700">+{formatNumber(c?.newLast30Days ?? 0)} in the last 30 days</span>}
        />
        <StatCard
          label="Active companies"
          tone="success"
          icon={<TrendingUpIcon size={18} />}
          loading={first}
          value={formatNumber(c?.active ?? 0)}
          hint={`${percent(c?.active ?? 0, c?.total ?? 0)}% of all companies`}
        />
        <StatCard
          label="Inactive companies"
          tone="neutral"
          icon={<BuildingIcon size={18} />}
          loading={first}
          value={formatNumber(c?.inactive ?? 0)}
          hint="Deactivated — their users can't sign in to them"
        />
        <StatCard
          label="Users"
          tone="warning"
          icon={<UsersIcon size={18} />}
          loading={first}
          value={formatNumber(u?.total ?? 0)}
          hint={<span className="text-success-700">+{formatNumber(u?.newLast30Days ?? 0)} signed up in the last 30 days</span>}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Onboarding" description="New companies and sign-ups per month." />
          <CardBody className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {first || !data ? (
              <>
                <Skeleton className="h-52" />
                <Skeleton className="h-52" />
              </>
            ) : (
              <>
                <MonthBars
                  title="Companies onboarded"
                  unit="companies"
                  points={data.onboardingTrend.map((t) => ({ month: t.month, value: t.companies }))}
                />
                <MonthBars
                  title="User sign-ups"
                  unit="users"
                  points={data.onboardingTrend.map((t) => ({ month: t.month, value: t.users }))}
                />
              </>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Company health" description="Active companies that billed in the last 30 days." />
          <CardBody>
            {first || !c ? (
              <Skeleton className="h-40" />
            ) : (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="tabular text-3xl font-semibold">{percent(c.engagedLast30Days, c.active)}%</span>
                  <span className="text-sm text-fg-muted">engaged</span>
                </div>
                <div
                  className="mt-3 flex h-2.5 gap-0.5 overflow-hidden rounded-full bg-subtle"
                  role="img"
                  aria-label={`${c.engagedLast30Days} engaged and ${c.dormant} dormant active companies`}
                >
                  <span className="rounded-l-full bg-success-600" style={{ width: `${percent(c.engagedLast30Days, c.active)}%` }} />
                  <span className="flex-1 rounded-r-full bg-warning-600/70" />
                </div>
                <div className="mt-4 divide-y divide-line">
                  <Row label="Engaged" hint="Created an invoice in the last 30 days" value={formatNumber(c.engagedLast30Days)} />
                  <Row label="Dormant" hint="Active, but no invoices in 30 days" value={formatNumber(c.dormant)} />
                  <Row
                    label="Inactive"
                    hint="Switched off by an admin"
                    value={formatNumber(c.inactive)}
                    href="/companies"
                    onNavigate={() => dispatch(setCompaniesQuery({ status: 'inactive' }))}
                  />
                </div>
              </>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader title="Users" description="Where every account stands." />
          <CardBody className="divide-y divide-line py-2">
            {first || !u ? (
              <Skeleton className="my-3 h-40" />
            ) : (
              <>
                <Row label="Active" value={formatNumber(u.active)} />
                <Row label="Blocked" hint="Can't sign in anywhere" value={formatNumber(u.blocked)} href="/blocked-users" />
                <Row label="Email not verified" hint="Signed up, never confirmed" value={formatNumber(u.unverified)} />
                <Row label="Not onboarded" hint="Verified, but not in any company yet" value={formatNumber(u.pendingOnboarding)} />
              </>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Platform usage" description="Billing activity across all companies." />
          <CardBody className="divide-y divide-line py-2">
            {first || !usage ? (
              <Skeleton className="my-3 h-40" />
            ) : (
              <>
                <Row label="Invoices, last 30 days" value={formatNumber(usage.invoicesLast30Days)} />
                <Row label="Billed, last 30 days" value={formatMoney(usage.billedLast30Days)} />
                <Row label="Invoices, all time" value={formatNumber(usage.totalInvoices)} />
                <Row label="Customers managed" value={formatNumber(usage.totalCustomers)} />
              </>
            )}
          </CardBody>
        </Card>

        <Card className="flex flex-col lg:col-span-2 xl:col-span-1">
          <CardHeader title="Subscriptions & trials" action={<Badge tone="brand">Coming soon</Badge>} />
          <CardBody className="flex flex-1 flex-col items-start gap-3">
            <span className="rounded-lg bg-brand-50 p-2 text-brand-600">
              <SparkIcon size={18} />
            </span>
            <p className="text-sm text-fg-muted">
              Trial status, plan usage and renewals will show here once subscription plans are added to Numora.
              Until then, every company has full access.
            </p>
          </CardBody>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader
            title="Newest companies"
            action={
              <Link href="/companies" className="text-sm font-medium text-brand-600 hover:text-brand-700">
                View all
              </Link>
            }
          />
          {first ? (
            <div className="space-y-3 p-5">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-10" />
              ))}
            </div>
          ) : data?.recentCompanies.length ? (
            <ul className="divide-y divide-line">
              {data.recentCompanies.map((co) => (
                <li key={co.id}>
                  <button
                    type="button"
                    onClick={() => router.push(`/companies/${co.id}`)}
                    className="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-subtle/60"
                  >
                    <Avatar name={co.name} src={co.logo} square size={36} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{co.name}</span>
                      <span className="block text-xs text-fg-subtle">
                        {co.userCount} {co.userCount === 1 ? 'user' : 'users'}
                        {co.place ? ` · ${co.place}` : ''} · joined {formatRelative(co.createdAt)}
                      </span>
                    </span>
                    <StatusBadge active={co.isActive} />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={<BuildingIcon />} title="No companies yet" />
          )}
        </Card>

        <Card>
          <CardHeader title="Most active companies" description="By invoices created, all time." />
          {first ? (
            <div className="space-y-3 p-5">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-10" />
              ))}
            </div>
          ) : data?.topCompanies.length ? (
            <ol className="divide-y divide-line">
              {data.topCompanies.map((co, i) => {
                const top = data.topCompanies[0].invoiceCount || 1;
                return (
                  <li key={co.id}>
                    <Link href={`/companies/${co.id}`} className="flex items-center gap-4 px-5 py-3 hover:bg-subtle/60">
                      <span className="tabular w-4 text-sm text-fg-subtle">{i + 1}</span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className={cn('truncate text-sm font-medium', !co.isActive && 'text-fg-muted')}>{co.name}</span>
                          {!co.isActive && <Badge>Inactive</Badge>}
                        </span>
                        <span className="mt-1.5 block h-1.5 rounded-full bg-subtle">
                          <span className="block h-full rounded-full bg-brand-500" style={{ width: `${(co.invoiceCount / top) * 100}%` }} />
                        </span>
                      </span>
                      <span className="text-right">
                        <span className="tabular block text-sm font-semibold">{formatNumber(co.invoiceCount)}</span>
                        <span className="tabular block text-xs text-fg-subtle">{formatMoney(co.billedTotal)} billed</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          ) : (
            <EmptyState icon={<ReceiptIcon />} title="No invoices yet" description="Companies show up here once they start billing." />
          )}
        </Card>
      </div>
    </>
  );
}
