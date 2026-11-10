import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type BadgeTone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info';

const tones: Record<BadgeTone, string> = {
  neutral: 'bg-subtle text-fg-muted ring-line',
  brand: 'bg-brand-50 text-brand-700 ring-brand-200',
  success: 'bg-success-50 text-success-700 ring-success-600/20',
  warning: 'bg-warning-50 text-warning-700 ring-warning-600/20',
  danger: 'bg-danger-50 text-danger-700 ring-danger-600/20',
  info: 'bg-info-50 text-info-700 ring-info-700/15',
};

const dots: Record<BadgeTone, string> = {
  neutral: 'bg-fg-subtle',
  brand: 'bg-brand-500',
  success: 'bg-success-600',
  warning: 'bg-warning-600',
  danger: 'bg-danger-600',
  info: 'bg-info-700',
};

export function Badge({
  tone = 'neutral',
  dot,
  children,
  className,
}: {
  tone?: BadgeTone;
  dot?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset',
        tones[tone],
        className,
      )}
    >
      {dot && <span className={cn('size-1.5 rounded-full', dots[tone])} />}
      {children}
    </span>
  );
}

/** Active / Inactive pill used across lists. */
export function StatusBadge({ active, activeLabel = 'Active', inactiveLabel = 'Inactive' }: {
  active: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
}) {
  return (
    <Badge tone={active ? 'success' : 'neutral'} dot>
      {active ? activeLabel : inactiveLabel}
    </Badge>
  );
}
