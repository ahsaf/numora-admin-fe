import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { AlertIcon, InfoIcon } from './icons';

export function Alert({
  tone = 'danger',
  title,
  children,
  action,
  className,
}: {
  tone?: 'danger' | 'info' | 'warning';
  title?: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  const styles = {
    danger: 'border-danger-600/20 bg-danger-50 text-danger-700',
    warning: 'border-warning-600/20 bg-warning-50 text-warning-700',
    info: 'border-info-700/15 bg-info-50 text-info-700',
  }[tone];
  return (
    <div role="alert" className={cn('flex items-start gap-3 rounded-lg border px-4 py-3 text-sm', styles, className)}>
      {tone === 'info' ? <InfoIcon size={18} className="mt-px shrink-0" /> : <AlertIcon size={18} className="mt-px shrink-0" />}
      <div className="min-w-0 flex-1">
        {title && <p className="font-medium">{title}</p>}
        {children && <div className={cn(title && 'mt-0.5 opacity-90')}>{children}</div>}
      </div>
      {action}
    </div>
  );
}
