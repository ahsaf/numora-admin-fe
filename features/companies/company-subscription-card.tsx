'use client';

import { useCallback, useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, CardBody, CardHeader, Skeleton } from '@/components/ui';
import { useConfirm } from '@/hooks/use-confirm';
import { subscriptionsApi } from '@/lib/api/admin-api';
import { getErrorMessage } from '@/lib/api/client';
import {
  PAY_AS_YOU_GO_RESOURCES,
  PLAN_RESOURCES,
  type CompanySubscription,
  type SubscriptionPeriod,
} from '@/lib/api/types';
import { cn } from '@/lib/cn';
import { formatDate, formatMoney, formatNumber } from '@/lib/format';
import { useAppDispatch } from '@/store/hooks';
import { notify } from '@/store/slices/ui-slice';
import { SubscriptionBadge, cycleLabel, featureLabel } from '@/features/plans/plan-labels';
import { ActivateSubscriptionModal } from './activate-subscription-modal';

/** The company's plan, usage against its limits, and every period it paid for. */
export function CompanySubscriptionCard({ companyId, companyName }: { companyId: number; companyName: string }) {
  const dispatch = useAppDispatch();
  const [sub, setSub] = useState<CompanySubscription | null>(null);
  /** When `sub` was loaded; periods are judged running or ended against it. */
  const [loadedAt, setLoadedAt] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [activating, setActivating] = useState(false);
  const { ask, dialog } = useConfirm();

  const load = useCallback(
    () =>
      subscriptionsApi.get(companyId).then(
        (res) => {
          setError(null);
          setSub(res.data);
          setLoadedAt(Date.now());
        },
        (e) => setError(getErrorMessage(e)),
      ),
    [companyId],
  );

  useEffect(() => {
    load();
  }, [load]);

  const cancel = (period: SubscriptionPeriod) => {
    const started = new Date(period.startsAt).getTime() <= loadedAt;
    ask(
      {
        title: started ? `End ${period.plan.name} now?` : `Call off the renewal on ${period.plan.name}?`,
        description: started
          ? 'The company becomes read-only right away, unless a renewal is queued after it. Record any refund yourself.'
          : `It was due to start ${formatDate(period.startsAt)}.`,
        confirmLabel: started ? 'End subscription' : 'Call off renewal',
        tone: 'danger',
      },
      async () => {
        try {
          const res = await subscriptionsApi.cancel(companyId, period.id);
          dispatch(notify('success', res.message || 'Subscription cancelled'));
          await load();
        } catch (e) {
          dispatch(notify('error', getErrorMessage(e)));
        }
      },
    );
  };

  if (error && !sub) {
    return (
      <Card>
        <CardHeader title="Subscription" />
        <CardBody>
          <Alert title="Could not load the subscription">
            {error}{' '}
            <button className="font-medium underline" onClick={load}>
              Try again
            </button>
          </Alert>
        </CardBody>
      </Card>
    );
  }

  if (!sub) {
    return (
      <Card>
        <CardHeader title="Subscription" />
        <CardBody className="flex flex-col gap-3">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-16 w-full" />
        </CardBody>
      </Card>
    );
  }

  const { plan, current } = sub;
  const running = sub.canWrite && current;

  return (
    <Card>
      <CardHeader
        title={
          <span className="flex flex-wrap items-center gap-2">
            Subscription <SubscriptionBadge status={sub.status} />
          </span>
        }
        description={
          running
            ? `${plan?.name} · ${cycleLabel(current.cycle)} · ends ${formatDate(current.endsAt)} (${sub.daysLeft} day${sub.daysLeft === 1 ? '' : 's'} left)`
            : sub.status === 'expired'
              ? `${plan?.name} ended ${formatDate(current?.endsAt)}. The company is read-only until it renews.`
              : 'No plan yet. The company is read-only until you activate one.'
        }
        action={
          <Button onClick={() => setActivating(true)}>{running ? 'Renew / change plan' : 'Activate plan'}</Button>
        }
      />
      <CardBody className="flex flex-col gap-6">
        {plan && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-medium tracking-wide text-fg-subtle uppercase">Usage</p>
              <ul className="flex flex-col gap-2.5">
                {PLAN_RESOURCES.map((r) => (
                  <UsageRow key={r.key} label={r.label} used={sub.usage[r.key]} limit={plan.limits[r.key]} />
                ))}
              </ul>
            </div>
            <div className="flex flex-col gap-5">
              <div>
                <p className="mb-2 text-xs font-medium tracking-wide text-fg-subtle uppercase">Features</p>
                <div className="flex flex-wrap gap-1.5">
                  {plan.features.length ? (
                    plan.features.map((f) => <Badge key={f}>{featureLabel(f)}</Badge>)
                  ) : (
                    <span className="text-sm text-fg-muted">Only the basics</span>
                  )}
                </div>
              </div>
              {sub.payAsYouGo && (
                <div>
                  <p className="mb-2 text-xs font-medium tracking-wide text-fg-subtle uppercase">
                    Pay as you go · this month at current records
                  </p>
                  <ul className="flex flex-col gap-1 text-sm">
                    {sub.payAsYouGo.lines
                      .filter((l) => l.unitPrice > 0)
                      .map((l) => (
                        <li key={l.resource} className="tabular flex justify-between gap-3">
                          <span className="text-fg-muted">
                            {formatNumber(l.count)} ×{' '}
                            {PAY_AS_YOU_GO_RESOURCES.find((r) => r.key === l.resource)?.label.toLowerCase()} @{' '}
                            {formatMoney(l.unitPrice)}
                          </span>
                          <span>{formatMoney(l.amount)}</span>
                        </li>
                      ))}
                    <li className="tabular flex justify-between gap-3 border-t border-line pt-1 font-semibold">
                      <span>Total</span>
                      <span>{formatMoney(sub.payAsYouGo.total)}</span>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {sub.history.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium tracking-wide text-fg-subtle uppercase">History</p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-xs text-fg-muted">
                    <th className="py-2 pr-3 font-medium">Plan</th>
                    <th className="py-2 pr-3 font-medium">Period</th>
                    <th className="py-2 pr-3 text-right font-medium">Paid</th>
                    <th className="py-2 pr-3 font-medium">Reference</th>
                    <th className="py-2 font-medium">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {sub.history.map((p) => {
                    const ended = !!p.cancelledAt || new Date(p.endsAt).getTime() <= loadedAt;
                    const upcoming = !ended && new Date(p.startsAt).getTime() > loadedAt;
                    return (
                      <tr key={p.id} className={cn(ended && 'text-fg-muted')}>
                        <td className="py-2 pr-3">
                          <span className="font-medium text-fg">{p.plan.name}</span>{' '}
                          <span className="text-xs">· {cycleLabel(p.cycle)}</span>
                          {upcoming && (
                            <Badge tone="brand" className="ml-2">
                              Queued
                            </Badge>
                          )}
                          {p.cancelledAt && (
                            <Badge className="ml-2">Cancelled</Badge>
                          )}
                        </td>
                        <td className="py-2 pr-3 whitespace-nowrap">
                          {formatDate(p.startsAt)} – {formatDate(p.endsAt)}
                        </td>
                        <td className="tabular py-2 pr-3 text-right">{formatMoney(p.amount)}</td>
                        <td className="py-2 pr-3" title={p.notes ?? undefined}>
                          {p.paymentReference || '—'}
                        </td>
                        <td className="py-2 text-right">
                          {!ended && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-danger-600 hover:text-danger-700"
                              onClick={() => cancel(p)}
                            >
                              {upcoming ? 'Call off' : 'End now'}
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardBody>

      {activating && (
        <ActivateSubscriptionModal
          open
          companyId={companyId}
          companyName={companyName}
          subscription={sub}
          onClose={() => setActivating(false)}
          onDone={(message) => {
            dispatch(notify('success', message));
            setActivating(false);
            load();
          }}
        />
      )}
      {dialog}
    </Card>
  );
}

function UsageRow({ label, used, limit }: { label: string; used: number; limit: number | null }) {
  const pct = limit ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const full = limit !== null && used >= limit;
  return (
    <li>
      <div className="flex justify-between gap-3 text-sm">
        <span className="text-fg-muted">{label}</span>
        <span className={cn('tabular', full && 'font-medium text-danger-600')}>
          {formatNumber(used)}
          {limit === null ? <span className="text-fg-subtle"> · unlimited</span> : ` / ${formatNumber(limit)}`}
        </span>
      </div>
      {limit !== null && (
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-subtle">
          <div
            className={cn('h-full rounded-full', full ? 'bg-danger-600' : pct >= 80 ? 'bg-warning-600' : 'bg-brand-500')}
            style={{ width: `${limit === 0 ? 100 : pct}%` }}
          />
        </div>
      )}
    </li>
  );
}
