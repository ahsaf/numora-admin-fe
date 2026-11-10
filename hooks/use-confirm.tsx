'use client';

import { useCallback, useState } from 'react';
import { ConfirmDialog, type ConfirmOptions } from '@/components/ui/confirm-dialog';

type Pending = ConfirmOptions & { action: () => Promise<unknown> };

/**
 * `ask(options, action)` opens a confirm dialog; `action` runs on confirm, with the
 * button showing a spinner until it settles. Render `dialog` once in the component.
 */
export function useConfirm() {
  const [pending, setPending] = useState<Pending | null>(null);
  const [running, setRunning] = useState(false);

  const ask = useCallback((options: ConfirmOptions, action: () => Promise<unknown>) => {
    setPending({ ...options, action });
  }, []);

  const confirm = async () => {
    if (!pending) return;
    setRunning(true);
    try {
      await pending.action();
    } finally {
      setRunning(false);
      setPending(null);
    }
  };

  const dialog = (
    <ConfirmDialog
      open={!!pending}
      title={pending?.title ?? ''}
      description={pending?.description}
      confirmLabel={pending?.confirmLabel}
      tone={pending?.tone}
      loading={running}
      onConfirm={confirm}
      onClose={() => !running && setPending(null)}
    />
  );

  return { ask, dialog };
}
