'use client';

import { useEffect } from 'react';
import { cn } from '@/lib/cn';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { dismissToast, type Toast } from '@/store/slices/ui-slice';
import { AlertIcon, CheckIcon, InfoIcon, XIcon } from './icons';

const TOAST_MS = 4000;

function ToastItem({ toast }: { toast: Toast }) {
  const dispatch = useAppDispatch();
  useEffect(() => {
    const id = setTimeout(() => dispatch(dismissToast(toast.id)), TOAST_MS);
    return () => clearTimeout(id);
  }, [dispatch, toast.id]);

  const icon =
    toast.tone === 'success' ? <CheckIcon size={16} /> : toast.tone === 'error' ? <AlertIcon size={16} /> : <InfoIcon size={16} />;
  return (
    <div
      role={toast.tone === 'error' ? 'alert' : 'status'}
      className="pointer-events-auto flex w-80 animate-slide-in items-start gap-3 rounded-lg border border-line bg-surface p-3.5 text-sm shadow-pop"
    >
      <span
        className={cn(
          'mt-px rounded-full p-1',
          toast.tone === 'success' && 'bg-success-50 text-success-600',
          toast.tone === 'error' && 'bg-danger-50 text-danger-600',
          toast.tone === 'info' && 'bg-info-50 text-info-700',
        )}
      >
        {icon}
      </span>
      <p className="flex-1 pt-0.5 text-fg">{toast.message}</p>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => dispatch(dismissToast(toast.id))}
        className="rounded p-0.5 text-fg-subtle hover:text-fg"
      >
        <XIcon size={14} />
      </button>
    </div>
  );
}

export function Toaster() {
  const toasts = useAppSelector((s) => s.ui.toasts);
  return (
    <div aria-live="polite" className="pointer-events-none fixed right-4 bottom-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  );
}
