'use client';

import { cn } from '@/lib/cn';
import { SearchIcon, XIcon } from './icons';

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

export function SearchInput({ value, onChange, placeholder = 'Search…', className }: Props) {
  return (
    <div className={cn('relative w-full sm:w-72', className)}>
      <SearchIcon size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-fg-subtle" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-9 w-full rounded-lg border border-line-strong bg-surface pr-8 pl-9 text-sm shadow-card placeholder:text-fg-subtle focus:border-brand-400 focus:ring-4 focus:ring-brand-100 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-0.5 text-fg-subtle hover:text-fg"
        >
          <XIcon size={14} />
        </button>
      )}
    </div>
  );
}
