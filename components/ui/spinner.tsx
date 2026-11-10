import { cn } from '@/lib/cn';

export function Spinner({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      style={{ width: size, height: size }}
      className={cn('inline-block animate-spin rounded-full border-2 border-current border-r-transparent', className)}
    />
  );
}

/** Centered spinner for a whole page or panel. */
export function LoadingBlock({ label = 'Loading…', className }: { label?: string; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-16 text-fg-subtle', className)}>
      <Spinner size={22} className="text-brand-500" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-subtle', className)} />;
}
