'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { Brand } from '@/components/layout/brand';
import { Alert, Button, Input, MailIcon, PasswordInput } from '@/components/ui';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchSession, login } from '@/store/slices/auth-slice';

export function LoginView() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const status = useAppSelector((s) => s.auth.status);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Already signed in (cookie still valid) → skip the form.
  useEffect(() => {
    if (status === 'idle') dispatch(fetchSession());
    if (status === 'authenticated') router.replace('/dashboard');
  }, [status, dispatch, router]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setSubmitting(true);
    setError(null);
    const result = await dispatch(login({ email: email.trim(), password }));
    if (login.rejected.match(result)) {
      setError(result.payload ?? 'Unable to sign in');
      setSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_minmax(460px,40%)]">
      <section className="relative hidden overflow-hidden bg-nav p-12 lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-40 [background:radial-gradient(60%_50%_at_20%_10%,var(--color-brand-600),transparent),radial-gradient(40%_40%_at_90%_90%,var(--color-brand-800),transparent)]"
        />
        <Brand inverted className="relative" />
        <div className="relative max-w-md">
          <h1 className="text-3xl leading-tight font-semibold text-white">Run the Numora platform from one place.</h1>
          <p className="mt-3 text-nav-fg">
            Companies, their users and platform usage — with subscriptions and plans coming next.
          </p>
        </div>
        <p className="relative text-xs text-nav-fg/60">Restricted to the Numora super admin.</p>
      </section>

      <section className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <Brand className="mb-10 lg:hidden" />
          <h2 className="text-2xl font-semibold tracking-tight">Sign in</h2>
          <p className="mt-1 text-sm text-fg-muted">Use the super admin account to continue.</p>

          <form onSubmit={submit} className="mt-8 flex flex-col gap-4" noValidate>
            {error && <Alert>{error}</Alert>}
            <Input
              label="Email or username"
              type="text"
              autoComplete="username"
              leftIcon={<MailIcon size={16} />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@numora.app"
              autoFocus
            />
            <PasswordInput
              label="Password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
            <Button type="submit" size="lg" fullWidth loading={submitting} className="mt-2">
              Sign in
            </Button>
          </form>
          <p className="mt-6 text-center text-xs text-fg-subtle">
            Forgot the password? Reset it on the server with <code className="font-mono">yarn admin:create</code>.
          </p>
        </div>
      </section>
    </div>
  );
}
