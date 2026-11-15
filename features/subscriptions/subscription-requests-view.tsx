'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  CreditCardIcon,
  DataTable,
  EmptyState,
  PageHeader,
  Pagination,
  Segmented,
  type BadgeTone,
  type Column,
} from '@/components/ui';
import { useConfirm } from '@/hooks/use-confirm';
import { subscriptionRequestsApi } from '@/lib/api/admin-api';
import { getErrorMessage } from '@/lib/api/client';
import {
  BillingCycle,
  PlanType,
  SubscriptionRequestStatus,
  type SubscriptionRequest,
  type SubscriptionRequestFilter,
} from '@/lib/api/types';
import { formatDate, formatNumber, formatRelative } from '@/lib/format';
import { useAppDispatch } from '@/store/hooks';
import { notify } from '@/store/slices/ui-slice';

const STATUS: Record<SubscriptionRequestStatus, [string, BadgeTone]> = {
  [SubscriptionRequestStatus.pending]: ['Pending', 'warning'],
  [SubscriptionRequestStatus.handled]: ['Done', 'success'],
  [SubscriptionRequestStatus.dismissed]: ['Dismissed', 'neutral'],
};

const cycleLabel = (r: SubscriptionRequest) =>
  r.plan.type === PlanType.payAsYouGo ? 'Pay as you go' : r.cycle === BillingCycle.yearly ? 'Yearly' : 'Monthly';

/**
 * Plans companies asked for from the web app. Activating a plan on the
 * company's page marks its pending requests done.
 */
export function SubscriptionRequestsView() {
  const dispatch = useAppDispatch();
  const { ask, dialog } = useConfirm();
  const [status, setStatus] = useState<SubscriptionRequestFilter>('pending');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [rows, setRows] = useState<SubscriptionRequest[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  /** The query the rows on screen belong to; loading until it matches the current one. */
  const queryKey = `${status}:${page}:${limit}`;
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const loading = loadedKey !== queryKey;

  const load = useCallback(
    () =>
      subscriptionRequestsApi.list({ page, limit, status }).then(
        (res) => {
          setRows(res.data);
          setTotalCount(res.totalCount);
          setPendingCount(res.pendingCount);
          setError(null);
          setLoadedKey(`${status}:${page}:${limit}`);
        },
        (e) => {
          setError(getErrorMessage(e));
          setLoadedKey(`${status}:${page}:${limit}`);
        },
      ),
    [page, limit, status],
  );

  useEffect(() => {
    load();
  }, [load]);

  const close = (r: SubscriptionRequest, next: SubscriptionRequestStatus.handled | SubscriptionRequestStatus.dismissed) =>
    ask(
      next === SubscriptionRequestStatus.handled
        ? {
            title: `Mark ${r.company.name}'s request done?`,
            description: 'Use this when you sorted it out another way. Activating a plan on the company page marks it done on its own.',
            confirmLabel: 'Mark done',
            tone: 'success',
          }
        : {
            title: `Dismiss ${r.company.name}'s request?`,
            description: 'It leaves the pending list. The company can send a new request.',
            confirmLabel: 'Dismiss',
            tone: 'danger',
          },
      async () => {
        try {
          const res = await subscriptionRequestsApi.setStatus(r.id, next);
          dispatch(notify('success', res.message || 'Saved'));
          if (rows.length === 1 && page > 1) setPage(page - 1);
          else await load();
        } catch (e) {
          dispatch(notify('error', getErrorMessage(e)));
        }
      },
    );

  const columns: Column<SubscriptionRequest>[] = [
    {
      key: 'company',
      header: 'Company',
      cell: (r) => (
        <div className="min-w-0">
          <Link href={`/companies/${r.company.id}`} className="font-medium text-brand-600 hover:underline">
            {r.company.name}
          </Link>
          <p className="truncate text-xs text-fg-subtle">
            {[r.requestedBy?.name, r.requestedBy?.email ?? r.requestedBy?.phone].filter(Boolean).join(' · ') || '—'}
          </p>
          {r.message && <p className="mt-1 max-w-md text-xs whitespace-pre-wrap text-fg-muted">“{r.message}”</p>}
        </div>
      ),
    },
    {
      key: 'plan',
      header: 'Plan',
      cell: (r) => (
        <div>
          <p className="font-medium">{r.plan.name}</p>
          <p className="text-xs text-fg-subtle">{cycleLabel(r)}</p>
        </div>
      ),
    },
    {
      key: 'requested',
      nowrap: true,
      header: 'Requested',
      className: 'hidden sm:table-cell',
      cell: (r) => (
        <span className="text-fg-muted" title={formatDate(r.createdAt)}>
          {formatRelative(r.createdAt)}
        </span>
      ),
    },
    {
      key: 'status',
      nowrap: true,
      header: 'Status',
      cell: (r) => {
        const [label, tone] = STATUS[r.status];
        return (
          <Badge tone={tone} dot>
            {label}
          </Badge>
        );
      },
    },
    {
      key: 'actions',
      nowrap: true,
      header: <span className="sr-only">Actions</span>,
      className: 'text-right',
      cell: (r) => (
        <div className="flex justify-end gap-2">
          <Link href={`/companies/${r.company.id}`}>
            <Button size="sm">Activate plan</Button>
          </Link>
          {r.status === SubscriptionRequestStatus.pending && (
            <>
              <Button size="sm" variant="secondary" onClick={() => close(r, SubscriptionRequestStatus.handled)}>
                Mark done
              </Button>
              <Button size="sm" variant="ghost" onClick={() => close(r, SubscriptionRequestStatus.dismissed)}>
                Dismiss
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Subscription requests"
        description={`Plans companies asked for from the subscription page${pendingCount ? ` · ${formatNumber(pendingCount)} pending` : ''}. Contact the company, then activate the plan on its page.`}
      />
      <Card>
        <div className="flex justify-end border-b border-line px-5 py-3.5">
          <Segmented
            ariaLabel="Request status"
            value={status}
            onChange={(value) => {
              setStatus(value);
              setPage(1);
            }}
            options={[
              { value: 'pending', label: 'Pending', count: pendingCount },
              { value: 'handled', label: 'Done' },
              { value: 'dismissed', label: 'Dismissed' },
              { value: 'all', label: 'All' },
            ]}
          />
        </div>
        {error && (
          <Alert className="m-5" action={<Button size="sm" variant="secondary" onClick={load}>Retry</Button>}>
            {error}
          </Alert>
        )}
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(r) => r.id}
          loading={loading}
          empty={
            <EmptyState
              icon={<CreditCardIcon />}
              title={status === 'pending' ? 'No pending requests' : 'No requests here'}
              description="When a company asks for a plan from its subscription page, it shows up here."
            />
          }
          footer={
            totalCount > 0 && (
              <Pagination
                page={page}
                limit={limit}
                totalCount={totalCount}
                onPageChange={setPage}
                onLimitChange={(value) => {
                  setLimit(value);
                  setPage(1);
                }}
              />
            )
          }
        />
      </Card>
      {dialog}
    </>
  );
}
