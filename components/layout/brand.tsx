import { cn } from '@/lib/cn';

export function Brand({ className, inverted }: { className?: string; inverted?: boolean }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <span className="flex size-8 items-center justify-center rounded-lg bg-brand-500 text-sm font-bold text-white shadow-sm">
        N
      </span>
      <span className="leading-tight">
        <span className={cn('block text-[15px] font-semibold', inverted ? 'text-white' : 'text-fg')}>Numora</span>
        <span className={cn('block text-[11px] font-medium tracking-wide uppercase', inverted ? 'text-nav-fg' : 'text-fg-subtle')}>
          Admin console
        </span>
      </span>
    </div>
  );
}
