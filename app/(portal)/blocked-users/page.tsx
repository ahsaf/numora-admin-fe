import type { Metadata } from 'next';
import { BlockedUsersView } from '@/features/users/blocked-users-view';

export const metadata: Metadata = { title: 'Blocked users' };

export default function BlockedUsersPage() {
  return <BlockedUsersView />;
}
