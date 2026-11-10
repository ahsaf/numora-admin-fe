import type { Metadata } from 'next';
import { E2eTestRunner } from '@/features/e2e/e2e-test-runner';

export const metadata: Metadata = { title: 'E2E tests' };

/**
 * A `.dev.tsx` page: next.config.ts only treats it as a route under `next dev`, so a
 * production build (the droplet) has no /e2e route and doesn't bundle the runner UI.
 */
export default function E2eTestsPage() {
  return <E2eTestRunner />;
}
