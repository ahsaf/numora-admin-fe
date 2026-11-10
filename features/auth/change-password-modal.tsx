'use client';

import { useState, type FormEvent } from 'react';
import { Alert, Button, Modal, PasswordInput } from '@/components/ui';
import { authApi } from '@/lib/api/admin-api';
import { getErrorMessage } from '@/lib/api/client';
import { useAppDispatch } from '@/store/hooks';
import { notify } from '@/store/slices/ui-slice';
import { PASSWORD_HINT, PASSWORD_REGEX } from './password-rules';

const empty = { currentPassword: '', newPassword: '', confirmPassword: '' };

export function ChangePasswordModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dispatch = useAppDispatch();
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState<Partial<typeof empty>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const close = () => {
    setForm(empty);
    setErrors({});
    setServerError(null);
    onClose();
  };

  const set = (key: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((er) => ({ ...er, [key]: undefined }));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next: Partial<typeof empty> = {};
    if (!form.currentPassword) next.currentPassword = 'Enter your current password';
    if (!PASSWORD_REGEX.test(form.newPassword)) next.newPassword = PASSWORD_HINT;
    else if (form.newPassword === form.currentPassword) next.newPassword = 'Choose a password you are not using now';
    if (form.confirmPassword !== form.newPassword) next.confirmPassword = 'Passwords do not match';
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    setServerError(null);
    try {
      await authApi.changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      dispatch(notify('success', 'Password changed. Other admin sessions were signed out.'));
      close();
    } catch (err) {
      setServerError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      busy={saving}
      title="Change password"
      description="You stay signed in here; every other admin session is signed out."
    >
      <form id="change-password" onSubmit={submit} className="flex flex-col gap-4" noValidate>
        {serverError && <Alert>{serverError}</Alert>}
        <PasswordInput
          label="Current password"
          autoComplete="current-password"
          value={form.currentPassword}
          onChange={set('currentPassword')}
          error={errors.currentPassword}
          autoFocus
        />
        <PasswordInput
          label="New password"
          autoComplete="new-password"
          value={form.newPassword}
          onChange={set('newPassword')}
          error={errors.newPassword}
          hint={PASSWORD_HINT}
        />
        <PasswordInput
          label="Confirm new password"
          autoComplete="new-password"
          value={form.confirmPassword}
          onChange={set('confirmPassword')}
          error={errors.confirmPassword}
        />
        <div className="-mx-6 mt-1 flex justify-end gap-2 border-t border-line bg-subtle/50 px-6 py-3.5">
          <Button variant="secondary" onClick={close} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            Update password
          </Button>
        </div>
      </form>
    </Modal>
  );
}
