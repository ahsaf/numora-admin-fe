import type { Metadata } from 'next';
import { PlansView } from '@/features/plans/plans-view';

export const metadata: Metadata = { title: 'Plans' };

export default function PlansPage() {
  return <PlansView />;
}
