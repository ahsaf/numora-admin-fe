import type { Metadata } from 'next';
import { SubscriptionRequestsView } from '@/features/subscriptions/subscription-requests-view';

export const metadata: Metadata = { title: 'Subscription requests' };

export default function SubscriptionRequestsPage() {
  return <SubscriptionRequestsView />;
}
