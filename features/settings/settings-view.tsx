'use client';

import { useEffect, useState, type FormEvent } from 'react';
import {
  Alert,
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  LoadingBlock,
  MailIcon,
  PageHeader,
  PhoneIcon,
} from '@/components/ui';
import { settingsApi } from '@/lib/api/admin-api';
import { getErrorMessage } from '@/lib/api/client';
import type { PlatformSettings } from '@/lib/api/types';
import { useAppDispatch } from '@/store/hooks';
import { notify } from '@/store/slices/ui-slice';

/** Platform settings stored in the database: the subscription contact and who gets request emails. */
export function SettingsView() {
  const dispatch = useAppDispatch();
  const [form, setForm] = useState<PlatformSettings | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = () =>
    settingsApi.get().then(
      (res) => {
        setLoadError(null);
        setForm(res.data);
      },
      (e) => setLoadError(getErrorMessage(e)),
    );

  useEffect(() => {
    load();
  }, []);

  const set = (key: keyof PlatformSettings) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => (f ? { ...f, [key]: e.target.value } : f));

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await settingsApi.update(form);
      setForm(res.data);
      dispatch(notify('success', res.message || 'Settings saved'));
    } catch (err) {
      setSaveError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader title="Settings" description="Platform-wide settings, used across every company." />

      {loadError && (
        <Alert className="mb-6" title="Could not load settings">
          {loadError}{' '}
          <button className="font-medium underline" onClick={load}>
            Try again
          </button>
        </Alert>
      )}

      {!form && !loadError && <LoadingBlock label="Loading settings…" />}

      {form && (
        <form onSubmit={save} className="flex max-w-2xl flex-col gap-6">
          <Card>
            <CardHeader
              title="Subscription contact"
              description="Shown to companies on their subscription page, and when they pick a plan."
            />
            <CardBody className="flex flex-col gap-4">
              <Input label="Name" placeholder="e.g. Numora Sales" maxLength={100} value={form.contactName} onChange={set('contactName')} />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="Mobile number"
                  type="tel"
                  placeholder="+91 98765 43210"
                  maxLength={20}
                  leftIcon={<PhoneIcon size={15} />}
                  value={form.contactPhone}
                  onChange={set('contactPhone')}
                />
                <Input
                  label="Email"
                  type="email"
                  placeholder="sales@example.com"
                  maxLength={200}
                  leftIcon={<MailIcon size={15} />}
                  value={form.contactEmail}
                  onChange={set('contactEmail')}
                />
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Subscription request emails"
              description="Who gets an email when a company requests a plan."
            />
            <CardBody>
              <Input
                label="Send to"
                placeholder="admin@example.com, billing@example.com"
                maxLength={500}
                hint="Separate addresses with commas. Leave empty to use the contact email above, or every super admin if that's empty too."
                value={form.requestNotifyEmails}
                onChange={set('requestNotifyEmails')}
              />
            </CardBody>
          </Card>

          {saveError && <Alert title="Could not save">{saveError}</Alert>}

          <div>
            <Button type="submit" loading={saving}>
              Save settings
            </Button>
          </div>
        </form>
      )}
    </>
  );
}
