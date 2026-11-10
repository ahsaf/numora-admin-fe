import type { ReactNode } from 'react';
import {
  BuildingIcon,
  CreditCardIcon,
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
];
