import { formatNumber } from '@/lib/format';
import { Button } from './button';
import { ChevronLeftIcon, ChevronRightIcon } from './icons';

type Props = {
  page: number;
  limit: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  limitOptions?: number[];
};

export function Pagination({ page, limit, totalCount, onPageChange, onLimitChange, limitOptions = [10, 25, 50] }: Props) {
  const lastPage = Math.max(1, Math.ceil(totalCount / limit));
  const from = totalCount === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, totalCount);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-3 text-sm text-fg-muted">
      <div className="flex items-center gap-3">
        <span className="tabular">
          {formatNumber(from)}–{formatNumber(to)} of {formatNumber(totalCount)}
        </span>
        {onLimitChange && (
          <label className="flex items-center gap-1.5">
            <span className="sr-only sm:not-sr-only">Rows</span>
            <select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="h-8 rounded-md border border-line-strong bg-surface px-2 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-brand-100"
            >
              {limitOptions.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className="tabular">
          Page {page} of {lastPage}
        </span>
        <Button
          variant="secondary"
          size="sm"
          aria-label="Previous page"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          icon={<ChevronLeftIcon size={14} />}
        />
        <Button
          variant="secondary"
          size="sm"
          aria-label="Next page"
          disabled={page >= lastPage}
          onClick={() => onPageChange(page + 1)}
          icon={<ChevronRightIcon size={14} />}
        />
      </div>
    </div>
  );
}
