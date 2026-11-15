'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Alert, Button, Input, Modal, Segmented, Select } from '@/components/ui';
import { plansApi, subscriptionsApi } from '@/lib/api/admin-api';
import { getErrorMessage } from '@/lib/api/client';
import { BillingCycle, PlanType, type CompanySubscription, type Plan } from '@/lib/api/types';
import { formatDate, formatMoney } from '@/lib/format';
import { planPriceText } from '@/features/plans/plan-labels';

type Cycle = BillingCycle.monthly | BillingCycle.yearly;

/**
 * Records a payment the company made outside the app and gives it a period
 * on a plan: starting when the running one ends, or right away.
 */
export function ActivateSubscriptionModal({
  open,
  companyId,
  companyName,
  subscription,
  onClose,
  onDone,
}: {
  open: boolean;
  companyId: number;
  companyName: string;
  subscription: CompanySubscription;
  onClose: () => void;
  onDone: (message: string) => void;
}) {
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [planId, setPlanId] = useState<number | ''>('');
  const [cycle, setCycle] = useState<Cycle>(BillingCycle.monthly);
  const [amount, setAmount] = useState('');
  const [startNow, setStartNow] = useState(false);
  const [paymentReference, setPaymentReference] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    plansApi
      .list()
      .then((res) => setPlans(res.data.filter((p) => !p.isTrial)))
      .catch((e) => setError(getErrorMessage(e)));
  }, []);

  const plan = plans?.find((p) => p.id === planId) ?? null;
  const isPayg = plan?.type === PlanType.payAsYouGo;
  const running = subscription.canWrite && subscription.current;
  const queuedEnd = [...subscription.upcoming].sort((a, b) => b.endsAt.localeCompare(a.endsAt))[0]?.endsAt;
  const startsOn = startNow || !running ? 'today' : formatDate(queuedEnd ?? subscription.current!.endsAt);

  // The amount the server would charge, shown as the default.
  const suggested = useMemo(() => {
    if (!plan) return null;
    if (plan.type === PlanType.payAsYouGo) {
      const usage = subscription.usage;
      return Object.entries(plan.unitPrices).reduce(
        (sum, [key, price]) => sum + price * (usage[key as keyof typeof usage] ?? 0),
        0,
      );
    }
    return cycle === BillingCycle.yearly ? plan.yearlyPrice : plan.monthlyPrice;
  }, [plan, cycle, subscription.usage]);

  const pickPlan = (id: number | '') => {
    setPlanId(id);
    setAmount('');
    const next = plans?.find((p) => p.id === id);
    if (next && next.type === PlanType.fixed) {
      setCycle(next.monthlyPrice !== null ? BillingCycle.monthly : BillingCycle.yearly);
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!plan) return setError('Pick a plan');
    if (amount && !/^\d+(\.\d{1,2})?$/.test(amount.trim())) return setError('Enter a valid amount');
    setSaving(true);
    setError(null);
    try {
      const res = await subscriptionsApi.activate(companyId, {
        planId: plan.id,
        cycle: isPayg ? BillingCycle.monthly : cycle,
        ...(amount.trim() && { amount: Number(amount) }),
        startNow,
        paymentReference: paymentReference.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      onDone(res.message || 'Subscription activated');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      busy={saving}
      size="lg"
      title={running ? `Renew or change plan · ${companyName}` : `Activate plan · ${companyName}`}
      description="Record a payment the company made, and give it a period on the plan."
    >
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        {error && <Alert>{error}</Alert>}

        <Select
          label="Plan"
          value={planId}
          onChange={(e) => pickPlan(e.target.value ? Number(e.target.value) : '')}
          disabled={!plans}
          autoFocus
        >
          <option value="">{plans ? 'Pick a plan' : 'Loading plans…'}</option>
          {plans?.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} — {planPriceText(p)}
            </option>
          ))}
        </Select>

        {plan && !isPayg && (
          <Segmented
            ariaLabel="Billing cycle"
            value={String(cycle)}
            onChange={(v) => {
              setCycle(Number(v) as Cycle);
              setAmount('');
            }}
            options={[
              ...(plan.monthlyPrice !== null ? [{ value: String(BillingCycle.monthly), label: 'Monthly' }] : []),
              ...(plan.yearlyPrice !== null ? [{ value: String(BillingCycle.yearly), label: 'Yearly' }] : []),
            ]}
          />
        )}
        {isPayg && (
          <p className="text-sm text-fg-muted">
            Pay-as-you-go runs a month at a time. The amount is its records now times their prices.
          </p>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Amount paid"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={suggested !== null ? formatMoney(suggested) : ''}
            hint={suggested !== null ? `Leave empty for ${formatMoney(suggested)}` : undefined}
          />
          <Input
            label="Payment reference"
            value={paymentReference}
            onChange={(e) => setPaymentReference(e.target.value)}
            placeholder="UPI / bank transaction ID"
            maxLength={100}
          />
        </div>
        <Input label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" maxLength={500} />

        {running && (
          <label className="flex items-start gap-3 rounded-lg border border-line p-3">
            <input
              type="checkbox"
              className="mt-0.5 size-4 accent-brand-600"
              checked={startNow}
              onChange={(e) => setStartNow(e.target.checked)}
            />
            <span className="text-sm">
              <span className="font-medium text-fg">Start now</span>
              <span className="block text-fg-muted">
                Ends the current {subscription.status === 'trial' ? 'trial' : 'plan'} today and calls off any renewals
                already queued. Use it to upgrade or downgrade right away.
              </span>
            </span>
          </label>
        )}

        {plan && (
          <p className="text-sm text-fg-muted">
            Starts <span className="font-medium text-fg">{startsOn}</span> and runs for{' '}
            {!isPayg && cycle === BillingCycle.yearly ? 'a year' : 'a month'}.
          </p>
        )}

        <div className="-mx-6 mt-1 flex justify-end gap-2 border-t border-line bg-subtle/50 px-6 py-3.5">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" loading={saving} disabled={!plan}>
            {running && !startNow ? 'Queue renewal' : 'Activate'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
