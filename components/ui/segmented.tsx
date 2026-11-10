'use client';

import { cn } from '@/lib/cn';

export type SegmentOption<V extends string> = { value: V; label: string; count?: number };

/** A row of mutually exclusive filters (e.g. All / Active / Inactive). */
export function Segmented<V extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: SegmentOption<V>[];
  value: V;
  onChange: (value: V) => void;
  ariaLabel: string;
}) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className="inline-flex rounded-lg bg-subtle p-0.5">
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(opt.value)}
            className={cn(
              'inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors',
              selected ? 'bg-surface text-fg shadow-sm' : 'text-fg-muted hover:text-fg',
            )}
          >
            {opt.label}
            {opt.count !== undefined && (
              <span
                className={cn(
                  'tabular rounded-full px-1.5 text-xs',
                  selected ? 'bg-brand-50 text-brand-700' : 'bg-line text-fg-muted',
                )}
              >
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
