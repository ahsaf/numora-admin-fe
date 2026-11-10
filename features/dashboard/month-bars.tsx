'use client';

import { useState } from 'react';
import { cn } from '@/lib/cn';
import { formatMonth, formatNumber } from '@/lib/format';

type Point = { month: string; value: number };

/**
 * One series of monthly counts as thin bars on a shared baseline. Companies and users
 * get separate charts (their scales differ too much to share one axis).
 */
export function MonthBars({ title, points, unit }: { title: string; points: Point[]; unit: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...points.map((p) => p.value));
  const total = points.reduce((sum, p) => sum + p.value, 0);
  const active = hover ?? points.length - 1;

  return (
    <figure className="min-w-0">
      <figcaption className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium text-fg">{title}</span>
        <span className="tabular text-xs text-fg-muted">
          {formatNumber(total)} in {points.length} months
        </span>
      </figcaption>

      <div className="relative mt-4 h-40" onMouseLeave={() => setHover(null)}>
        {/* recessive gridlines */}
        <div aria-hidden="true" className="absolute inset-0 flex flex-col justify-between">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="border-t border-dashed border-line" />
          ))}
        </div>
        <div aria-hidden="true" className="absolute top-0 right-0 -translate-y-1/2 bg-surface pl-1 text-[10px] text-fg-subtle tabular">
          {formatNumber(max)}
        </div>
        <div className="relative flex h-full items-end gap-2 border-b border-line-strong">
          {points.map((p, i) => (
            <button
              key={p.month}
              type="button"
              onMouseEnter={() => setHover(i)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              aria-label={`${formatMonth(p.month)}: ${p.value} ${unit}`}
              className="group flex h-full flex-1 items-end justify-center focus-visible:outline-none"
            >
              <span
                style={{ height: `${(p.value / max) * 100}%` }}
                className={cn(
                  'w-full max-w-7 min-h-0.5 rounded-t transition-colors',
                  i === active ? 'bg-brand-500' : 'bg-brand-200 group-hover:bg-brand-400',
                )}
              />
            </button>
          ))}
        </div>
        {hover !== null && (
          <div
            role="tooltip"
            className="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 -translate-y-full rounded-md bg-fg px-2.5 py-1.5 text-xs whitespace-nowrap text-white shadow-pop"
            style={{ left: `${((hover + 0.5) / points.length) * 100}%` }}
          >
            <span className="font-medium">{formatMonth(points[hover].month)}</span> ·{' '}
            <span className="tabular">{formatNumber(points[hover].value)}</span> {unit}
          </div>
        )}
      </div>
      <div aria-hidden="true" className="mt-2 flex gap-2">
        {points.map((p, i) => (
          <span key={p.month} className={cn('flex-1 text-center text-[11px]', i === active ? 'font-medium text-fg' : 'text-fg-subtle')}>
            {formatMonth(p.month)}
          </span>
        ))}
      </div>

      <table className="sr-only">
        <caption>{title}</caption>
        <thead>
          <tr>
            <th>Month</th>
            <th>{unit}</th>
          </tr>
        </thead>
        <tbody>
          {points.map((p) => (
            <tr key={p.month}>
              <td>{p.month}</td>
              <td>{p.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
