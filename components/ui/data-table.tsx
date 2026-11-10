import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Skeleton } from './spinner';

export type Column<T> = {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  /** Tailwind classes for both th and td (width, alignment, responsive hiding). */
  className?: string;
  /** Keep the cell on one line (dates, numbers, actions). */
  nowrap?: boolean;
};

type Props<T> = {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  loading?: boolean;
  /** Shown instead of the body when there are no rows and nothing is loading. */
  empty?: ReactNode;
  onRowClick?: (row: T) => void;
  footer?: ReactNode;
  skeletonRows?: number;
};

/** A plain, accessible table: columns are described once and rendered for every row. */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading,
  empty,
  onRowClick,
  footer,
  skeletonRows = 6,
}: Props<T>) {
  const showSkeleton = loading && rows.length === 0;
  return (
    <div>
      <div className="relative overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-line bg-subtle/60">
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={cn('px-5 py-2.5 text-xs font-medium tracking-wide text-fg-muted uppercase', col.className)}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={cn('divide-y divide-line', loading && rows.length > 0 && 'opacity-60 transition-opacity')}>
            {showSkeleton &&
              Array.from({ length: skeletonRows }, (_, i) => (
                <tr key={`sk-${i}`}>
                  {columns.map((col) => (
                    <td key={col.key} className={cn('px-5 py-3.5', col.className)}>
                      <Skeleton className="h-4 w-3/4" />
                    </td>
                  ))}
                </tr>
              ))}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={columns.length}>{empty}</td>
              </tr>
            )}
            {rows.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn('transition-colors hover:bg-subtle/50', onRowClick && 'cursor-pointer')}
              >
                {columns.map((col) => (
                  <td key={col.key} className={cn('px-5 py-3 align-middle text-fg', col.nowrap && 'whitespace-nowrap', col.className)}>
                    {col.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {footer}
    </div>
  );
}
