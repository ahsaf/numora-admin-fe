import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Card } from './card';
import { Skeleton } from './spinner';

type Tone = 'brand' | 'success' | 'warning' | 'danger' | 'neutral';

const iconTones: Record<Tone, string> = {
  brand: 'bg-brand-50 text-brand-600',
  success: 'bg-success-50 text-success-600',
  warning: 'bg-warning-50 text-warning-600',
  danger: 'bg-danger-50 text-danger-600',
  neutral: 'bg-subtle text-fg-muted',
};

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = 'brand',
  loading,
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  tone?: Tone;
  loading?: boolean;
  className?: string;
}) {
  return (
    <Card className={cn('p-5', className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-fg-muted">{label}</p>
        {icon && <span className={cn('rounded-lg p-2', iconTones[tone])}>{icon}</span>}
      </div>
      {loading ? (
        <Skeleton className="mt-2 h-8 w-24" />
      ) : (
        <p className="tabular mt-1 text-[28px] leading-9 font-semibold tracking-tight text-fg">{value}</p>
      )}
      {hint && <div className="mt-1.5 text-xs text-fg-muted">{hint}</div>}
    </Card>
  );
}
