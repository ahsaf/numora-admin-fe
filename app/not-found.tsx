import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="text-sm font-semibold text-brand-600">404</p>
      <h1 className="text-2xl font-semibold tracking-tight">Page not found</h1>
      <p className="text-sm text-fg-muted">This page doesn&apos;t exist in the admin console.</p>
      <Link href="/dashboard" className="mt-2 text-sm font-medium text-brand-600 hover:text-brand-700">
        Back to dashboard
      </Link>
    </div>
  );
}
