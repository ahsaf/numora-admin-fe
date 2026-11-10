'use client';

import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchSession } from '@/store/slices/auth-slice';
import { LoadingBlock } from '../ui/spinner';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';

/** Portal frame. Renders nothing private until the session cookie is confirmed. */
export function AppShell({ children }: { children: ReactNode }) {
  const status = useAppSelector((s) => s.auth.status);
  const dispatch = useAppDispatch();
  const router = useRouter();

  useEffect(() => {
    if (status === 'idle') dispatch(fetchSession());
    if (status === 'unauthenticated') router.replace('/login');
  }, [status, dispatch, router]);

  if (status !== 'authenticated') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingBlock label="Checking your session…" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="lg:pl-64">
        <Topbar />
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
