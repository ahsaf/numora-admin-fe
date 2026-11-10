'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { XIcon } from './icons';

type Props = {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  /** Blocks closing (Esc / backdrop) while an action is running. */
  busy?: boolean;
};

const widths = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-2xl' };

/** Built on the native <dialog>, which handles focus trapping and Esc. */
export function Modal({ open, onClose, title, description, children, footer, size = 'md', busy }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current && !busy) onClose();
      }}
      className={cn(
        'm-auto w-[calc(100%-2rem)] rounded-card bg-surface p-0 text-fg shadow-pop backdrop:bg-fg/40 backdrop:backdrop-blur-[2px]',
        'open:animate-pop-in',
        widths[size],
      )}
    >
      {open && (
        <div className="flex flex-col">
          <div className="flex items-start justify-between gap-4 px-6 pt-5">
            <div>
              <h2 className="text-base font-semibold">{title}</h2>
              {description && <div className="mt-1 text-sm text-fg-muted">{description}</div>}
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              aria-label="Close"
              className="-mt-1 -mr-2 rounded-md p-1.5 text-fg-subtle hover:bg-subtle hover:text-fg disabled:opacity-50"
            >
              <XIcon size={16} />
            </button>
          </div>
          {children && <div className="px-6 pt-4">{children}</div>}
          {footer && <div className="mt-5 flex justify-end gap-2 border-t border-line bg-subtle/50 px-6 py-3.5">{footer}</div>}
          {!footer && <div className="pb-5" />}
        </div>
      )}
    </dialog>
  );
}
