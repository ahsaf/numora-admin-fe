import { Badge, type BadgeTone } from '@/components/ui';
import {
  BillingCycle,
  PLAN_FEATURES,
  PlanType,
  type Plan,
  type SubscriptionStatus,
} from '@/lib/api/types';
import { formatMoney } from '@/lib/format';

const STATUS: Record<SubscriptionStatus, { label: string; tone: BadgeTone }> = {
  trial: { label: 'Free trial', tone: 'info' },
  active: { label: 'Subscribed', tone: 'success' },
  expired: { label: 'Expired', tone: 'danger' },
  none: { label: 'No plan', tone: 'neutral' },
};

export function SubscriptionBadge({ status }: { status: SubscriptionStatus }) {
  const { label, tone } = STATUS[status];
  return (
    <Badge tone={tone} dot>
      {label}
    </Badge>
  );
}

export const cycleLabel = (cycle: BillingCycle) =>
  cycle === BillingCycle.trial ? 'Trial' : cycle === BillingCycle.yearly ? 'Yearly' : 'Monthly';

export const featureLabel = (key: string) => PLAN_FEATURES.find((f) => f.key === key)?.label ?? key;

/** "499 / month · 4,999 / year", or "Pay as you go" / "Free". */
export function planPriceText(plan: Pick<Plan, 'type' | 'monthlyPrice' | 'yearlyPrice' | 'isTrial'>) {
  if (plan.isTrial) return 'Free';
  if (plan.type === PlanType.payAsYouGo) return 'Pay as you go';
  return [
    plan.monthlyPrice !== null && `${formatMoney(plan.monthlyPrice)} / month`,
    plan.yearlyPrice !== null && `${formatMoney(plan.yearlyPrice)} / year`,
  ]
    .filter(Boolean)
    .join(' · ');
}
