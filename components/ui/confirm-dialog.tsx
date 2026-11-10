'use client';

import type { ReactNode } from 'react';
import { Button, type ButtonVariant } from './button';
import { Modal } from './modal';

export type ConfirmOptions = {
  title: ReactNode;
  description?: ReactNode;
  confirmLabel?: string;
  tone?: ButtonVariant;
};

type Props = ConfirmOptions & {
  open: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  tone = 'primary',
  loading,
  onConfirm,
  onClose,
}: Props) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      busy={loading}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant={tone} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    />
  );
}
