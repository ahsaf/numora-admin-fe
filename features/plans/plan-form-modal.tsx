'use client';

import { useState, type FormEvent } from 'react';
import { Alert, Button, Input, Modal, Segmented } from '@/components/ui';
import { plansApi } from '@/lib/api/admin-api';
import { getErrorMessage } from '@/lib/api/client';
import {
  PAY_AS_YOU_GO_RESOURCES,
  PLAN_FEATURES,
  PLAN_RESOURCES,
  PlanType,
  type PayAsYouGoResource,
  type Plan,
  type PlanFeature,
  type PlanInput,
  type PlanResource,
} from '@/lib/api/types';
import { cn } from '@/lib/cn';

type Form = {
  name: string;
  description: string;
  type: PlanType;
  monthlyPrice: string;
  yearlyPrice: string;
  features: PlanFeature[];
  /** '' = unlimited */
  limits: Record<PlanResource, string>;
  unitPrices: Record<PayAsYouGoResource, string>;
  isTrial: boolean;
};

const text = (n: number | null | undefined) => (n === null || n === undefined ? '' : String(n));

const toForm = (plan: Plan | null): Form => ({
  name: plan?.name ?? '',
  description: plan?.description ?? '',
  type: plan?.type ?? PlanType.fixed,
  monthlyPrice: text(plan?.monthlyPrice),
  yearlyPrice: text(plan?.yearlyPrice),
  features: plan?.features ?? PLAN_FEATURES.map((f) => f.key),
  limits: Object.fromEntries(PLAN_RESOURCES.map((r) => [r.key, text(plan?.limits[r.key])])) as Form['limits'],
  unitPrices: Object.fromEntries(
    PAY_AS_YOU_GO_RESOURCES.map((r) => [r.key, plan?.unitPrices[r.key] ? String(plan.unitPrices[r.key]) : '']),
  ) as Form['unitPrices'],
  isTrial: plan?.isTrial ?? false,
});

const isMoney = (v: string) => /^\d+(\.\d{1,2})?$/.test(v.trim());
const isCount = (v: string) => /^\d+$/.test(v.trim());

/** Creates a plan, or edits `plan`. */
export function PlanFormModal({
  open,
  plan,
  onClose,
  onSaved,
}: {
  open: boolean;
  plan: Plan | null;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const [form, setForm] = useState<Form>(() => toForm(plan));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isPayg = form.type === PlanType.payAsYouGo;
  const set = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: '' }));
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = 'Enter a name';
    if (!isPayg && !form.isTrial) {
      if (form.monthlyPrice && !isMoney(form.monthlyPrice)) next.monthlyPrice = 'Enter a valid amount';
      if (form.yearlyPrice && !isMoney(form.yearlyPrice)) next.yearlyPrice = 'Enter a valid amount';
      if (!form.monthlyPrice && !form.yearlyPrice) next.monthlyPrice = 'Enter a monthly or a yearly price';
    }
    if (isPayg) {
      for (const r of PAY_AS_YOU_GO_RESOURCES) {
        const v = form.unitPrices[r.key];
        if (v && !isMoney(v)) next[`unit.${r.key}`] = 'Invalid';
      }
      if (!PAY_AS_YOU_GO_RESOURCES.some((r) => Number(form.unitPrices[r.key]) > 0)) {
        next.unitPrices = 'Set a price for at least one record';
      }
    }
    for (const r of PLAN_RESOURCES) {
      const v = form.limits[r.key];
      if (v && !isCount(v)) next[`limit.${r.key}`] = 'Whole number';
    }
    return next;
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;

    const money = (v: string) => (v.trim() ? Number(v) : null);
    const body: PlanInput = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      type: form.type,
      monthlyPrice: isPayg || form.isTrial ? null : money(form.monthlyPrice),
      yearlyPrice: isPayg || form.isTrial ? null : money(form.yearlyPrice),
      features: form.features,
      limits: Object.fromEntries(
        PLAN_RESOURCES.map((r) => [r.key, form.limits[r.key].trim() ? Number(form.limits[r.key]) : null]),
      ),
      unitPrices: isPayg
        ? Object.fromEntries(
            PAY_AS_YOU_GO_RESOURCES.filter((r) => form.unitPrices[r.key].trim()).map((r) => [
              r.key,
              Number(form.unitPrices[r.key]),
            ]),
          )
        : {},
      isTrial: form.isTrial,
    };
    setSaving(true);
    setServerError(null);
    try {
      const res = plan ? await plansApi.update(plan.id, body) : await plansApi.create(body);
      onSaved(res.message || 'Plan saved');
    } catch (err) {
      setServerError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const toggleFeature = (key: PlanFeature) =>
    set('features', form.features.includes(key) ? form.features.filter((f) => f !== key) : [...form.features, key]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      busy={saving}
      size="lg"
      title={plan ? `Edit ${plan.name}` : 'New plan'}
      description={
        plan?.activeCompanies
          ? `${plan.activeCompanies} compan${plan.activeCompanies === 1 ? 'y is' : 'ies are'} on this plan; changes to features and limits apply to them right away.`
          : 'What companies on this plan can use, and what it costs.'
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-5" noValidate>
        {serverError && <Alert>{serverError}</Alert>}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            error={errors.name}
            maxLength={60}
            autoFocus
          />
          <Input
            label="Description"
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            maxLength={300}
            placeholder="Optional"
          />
        </div>

        <Section title="Pricing">
          {!form.isTrial && (
            <Segmented
              ariaLabel="Plan type"
              value={String(form.type)}
              onChange={(v) => set('type', Number(v) as PlanType)}
              options={[
                { value: String(PlanType.fixed), label: 'Monthly / yearly' },
                { value: String(PlanType.payAsYouGo), label: 'Pay as you go' },
              ]}
            />
          )}
          {form.isTrial ? (
            <p className="text-sm text-fg-muted">The trial plan is free for 30 days.</p>
          ) : isPayg ? (
            <>
              <p className="text-sm text-fg-muted">
                Charged each month for every record the company has. Leave a field empty for free.
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {PAY_AS_YOU_GO_RESOURCES.map((r) => (
                  <Input
                    key={r.key}
                    label={`Per ${r.label.toLowerCase()}`}
                    inputMode="decimal"
                    value={form.unitPrices[r.key]}
                    onChange={(e) => set('unitPrices', { ...form.unitPrices, [r.key]: e.target.value })}
                    error={errors[`unit.${r.key}`]}
                    placeholder="0"
                  />
                ))}
              </div>
              {errors.unitPrices && <p className="text-xs text-danger-600">{errors.unitPrices}</p>}
            </>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input
                label="Monthly price"
                inputMode="decimal"
                value={form.monthlyPrice}
                onChange={(e) => set('monthlyPrice', e.target.value)}
                error={errors.monthlyPrice}
                hint="Leave empty if it's sold yearly only"
              />
              <Input
                label="Yearly price"
                inputMode="decimal"
                value={form.yearlyPrice}
                onChange={(e) => set('yearlyPrice', e.target.value)}
                error={errors.yearlyPrice}
                hint="Leave empty if it's sold monthly only"
              />
            </div>
          )}
        </Section>

        <Section title="Features" description="Transactions, bank accounts and administration come with every plan.">
          <div className="flex flex-wrap gap-2">
            {PLAN_FEATURES.map((f) => {
              const on = form.features.includes(f.key);
              return (
                <button
                  key={f.key}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleFeature(f.key)}
                  className={cn(
                    'inline-flex h-8 items-center rounded-full border px-3 text-sm font-medium transition-colors',
                    on
                      ? 'border-brand-300 bg-brand-50 text-brand-700'
                      : 'border-line-strong text-fg-muted hover:bg-subtle',
                  )}
                >
                  {on ? '✓ ' : ''}
                  {f.label}
                </button>
              );
            })}
          </div>
        </Section>

        <Section title="Limits" description="Most records a company can add. Leave empty for unlimited.">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {PLAN_RESOURCES.map((r) => (
              <Input
                key={r.key}
                label={r.label}
                inputMode="numeric"
                value={form.limits[r.key]}
                onChange={(e) => set('limits', { ...form.limits, [r.key]: e.target.value })}
                error={errors[`limit.${r.key}`]}
                placeholder="Unlimited"
              />
            ))}
          </div>
        </Section>

        <label className="flex items-start gap-3 rounded-lg border border-line p-3">
          <input
            type="checkbox"
            className="mt-0.5 size-4 accent-brand-600"
            checked={form.isTrial}
            disabled={plan?.isTrial}
            onChange={(e) => {
              set('isTrial', e.target.checked);
              if (e.target.checked) set('type', PlanType.fixed);
            }}
          />
          <span className="text-sm">
            <span className="font-medium text-fg">Free trial plan</span>
            <span className="block text-fg-muted">
              {plan?.isTrial
                ? 'New companies get this plan for 30 days. To change it, make another plan the trial plan.'
                : "New companies get this plan for 30 days. It replaces the current trial plan."}
            </span>
          </span>
        </label>

        <div className="-mx-6 flex justify-end gap-2 border-t border-line bg-subtle/50 px-6 py-3.5">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            {plan ? 'Save plan' : 'Create plan'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="flex flex-col gap-3">
      <div>
        <legend className="text-sm font-semibold text-fg">{title}</legend>
        {description && <p className="text-xs text-fg-subtle">{description}</p>}
      </div>
      {children}
    </fieldset>
  );
}
