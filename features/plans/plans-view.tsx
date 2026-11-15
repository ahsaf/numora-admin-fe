'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardBody,
  EmptyState,
  LayersIcon,
  LoadingBlock,
  PageHeader,
} from '@/components/ui';
import { useConfirm } from '@/hooks/use-confirm';
import { plansApi } from '@/lib/api/admin-api';
import { getErrorMessage } from '@/lib/api/client';
import { PAY_AS_YOU_GO_RESOURCES, PLAN_RESOURCES, PlanType, type Plan } from '@/lib/api/types';
import { formatMoney, formatNumber } from '@/lib/format';
import { useAppDispatch } from '@/store/hooks';
import { notify } from '@/store/slices/ui-slice';
import { featureLabel, planPriceText } from './plan-labels';
import { PlanFormModal } from './plan-form-modal';

export function PlansView() {
  const dispatch = useAppDispatch();
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  /** undefined = closed, null = new plan */
  const [editing, setEditing] = useState<Plan | null | undefined>(undefined);
  const { ask, dialog } = useConfirm();

  const load = useCallback(
    () =>
      plansApi.list().then(
        (res) => {
          setError(null);
          setPlans(res.data);
        },
        (e) => setError(getErrorMessage(e)),
      ),
    [],
  );

  useEffect(() => {
    load();
  }, [load]);

  const remove = (plan: Plan) =>
    ask(
      {
        title: `Delete ${plan.name}?`,
        description: plan.activeCompanies
          ? `${plan.activeCompanies} compan${plan.activeCompanies === 1 ? 'y is' : 'ies are'} on it now. They keep it until their period ends, but it can't be picked again.`
          : "It can't be picked for new subscriptions. Past subscriptions keep their record.",
        confirmLabel: 'Delete plan',
        tone: 'danger',
      },
      async () => {
        try {
          const res = await plansApi.remove(plan.id);
          dispatch(notify('success', res.message || 'Plan deleted'));
          await load();
        } catch (e) {
          dispatch(notify('error', getErrorMessage(e)));
        }
      },
    );

  return (
    <>
      <PageHeader
        title="Plans"
        description="What companies pay for Numora, and what each plan lets them do."
        actions={<Button onClick={() => setEditing(null)}>New plan</Button>}
      />

      {error && (
        <Alert className="mb-6" title="Could not load plans">
          {error}{' '}
          <button className="font-medium underline" onClick={load}>
            Try again
          </button>
        </Alert>
      )}

      {!plans && !error && <LoadingBlock label="Loading plans…" />}

      {plans && plans.length === 0 && (
        <Card>
          <EmptyState
            icon={<LayersIcon />}
            title="No plans yet"
            description="Create a plan so companies can subscribe."
            action={<Button onClick={() => setEditing(null)}>New plan</Button>}
          />
        </Card>
      )}

      {plans && plans.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} onEdit={() => setEditing(plan)} onDelete={() => remove(plan)} />
          ))}
        </div>
      )}

      {editing !== undefined && (
        <PlanFormModal
          key={editing?.id ?? 'new'}
          open
          plan={editing}
          onClose={() => setEditing(undefined)}
          onSaved={(message) => {
            dispatch(notify('success', message));
            setEditing(undefined);
            load();
          }}
        />
      )}
      {dialog}
    </>
  );
}

function PlanCard({ plan, onEdit, onDelete }: { plan: Plan; onEdit: () => void; onDelete: () => void }) {
  const isPayg = plan.type === PlanType.payAsYouGo;
  const limited = PLAN_RESOURCES.filter((r) => plan.limits[r.key] !== null);
  const charged = PAY_AS_YOU_GO_RESOURCES.filter((r) => plan.unitPrices[r.key] > 0);
  return (
    <Card className="flex flex-col">
      <CardBody className="flex flex-1 flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold break-words">{plan.name}</h2>
              {plan.isTrial && <Badge tone="info">Trial plan</Badge>}
              {isPayg && <Badge tone="brand">Pay as you go</Badge>}
            </div>
            {plan.description && <p className="mt-0.5 text-sm text-fg-muted">{plan.description}</p>}
          </div>
          <span className="tabular shrink-0 text-xs text-fg-subtle">
            {formatNumber(plan.activeCompanies ?? 0)} on it
          </span>
        </div>

        <p className="tabular text-lg font-semibold text-fg">{planPriceText(plan)}</p>

        {isPayg && (
          <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            {charged.map((r) => (
              <li key={r.key} className="flex justify-between gap-2">
                <span className="text-fg-muted">{r.label}</span>
                <span className="tabular">{formatMoney(plan.unitPrices[r.key])} / mo</span>
              </li>
            ))}
          </ul>
        )}

        <div>
          <p className="mb-1.5 text-xs font-medium tracking-wide text-fg-subtle uppercase">Features</p>
          <div className="flex flex-wrap gap-1.5">
            {plan.features.length ? (
              plan.features.map((f) => <Badge key={f}>{featureLabel(f)}</Badge>)
            ) : (
              <span className="text-sm text-fg-muted">Only the basics</span>
            )}
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-xs font-medium tracking-wide text-fg-subtle uppercase">Limits</p>
          {limited.length ? (
            <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              {limited.map((r) => (
                <li key={r.key} className="flex justify-between gap-2">
                  <span className="text-fg-muted">{r.label}</span>
                  <span className="tabular">{formatNumber(plan.limits[r.key]!)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-fg-muted">Unlimited</p>
          )}
        </div>

        <div className="mt-auto flex gap-2 border-t border-line pt-4">
          <Button variant="secondary" size="sm" onClick={onEdit}>
            Edit
          </Button>
          {!plan.isTrial && (
            <Button variant="ghost" size="sm" onClick={onDelete} className="text-danger-600 hover:text-danger-700">
              Delete
            </Button>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
