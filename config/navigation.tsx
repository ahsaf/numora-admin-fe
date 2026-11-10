import type { ReactNode } from 'react';
import {
  BuildingIcon,
  CreditCardIcon,
  FlaskIcon,
  GaugeIcon,
  LayersIcon,
  UserBlockIcon,
} from '@/components/ui/icons';

export type NavItem = {
  label: string;
  href: string;
  icon: ReactNode;
  /** Shown greyed out with a "Soon" tag; for features that are planned but not built. */
  comingSoon?: boolean;
};

export type NavSection = { title?: string; items: NavItem[] };

/**
 * The sidebar. Add a new module by adding an item (and its route under app/(portal)).
 * Sections keep the menu readable as Numora grows (billing, plans, reports...).
 */
export const NAV_SECTIONS: NavSection[] = [
  {
    items: [{ label: 'Dashboard', href: '/dashboard', icon: <GaugeIcon /> }],
  },
  {
    title: 'Manage',
    items: [
      { label: 'Companies', href: '/companies', icon: <BuildingIcon /> },
      { label: 'Blocked users', href: '/blocked-users', icon: <UserBlockIcon /> },
    ],
  },
  {
    title: 'Billing',
    items: [
      { label: 'Subscriptions', href: '/subscriptions', icon: <CreditCardIcon />, comingSoon: true },
      { label: 'Plans', href: '/plans', icon: <LayersIcon />, comingSoon: true },
    ],
  },
  // `next dev` only (its route is app/(portal)/e2e/page.dev.tsx): runs Playwright on this machine.
  // NODE_ENV is inlined, so production builds drop this item. See e2e/README.md.
  ...(process.env.NODE_ENV === 'development'
    ? [{ title: 'Developer', items: [{ label: 'E2E tests', href: '/e2e', icon: <FlaskIcon /> }] }]
    : []),
];
