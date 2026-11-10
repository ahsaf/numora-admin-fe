import type { Page } from '@playwright/test';

import { expect } from '@playwright/test';

// ----------------------------------------------------------------------

/** Sidebar entries by their titles, as `navData` names them. */
export type NavTitle =
  | 'Dashboard'
  | 'Customers'
  | 'Products'
  | 'Services'
  | 'Transactions'
  | 'Bank accounts'
  | 'Vendors'
  | 'Reports'
  | 'Administration';

export const ALL_NAV_ITEMS: NavTitle[] = [
  'Dashboard',
  'Customers',
  'Products',
  'Services',
  'Transactions',
  'Bank accounts',
  'Vendors',
  'Reports',
  'Administration',
];

const navItem = (page: Page, title: NavTitle) =>
  page
    .getByTestId('nav-desktop')
    .getByTestId(`nav-item-${title.toLowerCase().replace(/\s+/g, '-')}`);

/** Opens a page from the sidebar and waits for its title. */
export async function openFromSidebar(page: Page, title: NavTitle, pageTitle: string = title) {
  await navItem(page, title).click();
  if (title === 'Dashboard') {
    await expect(page.getByTestId('dashboard-greeting')).toBeVisible();
  } else {
    await expect(page.getByTestId('page-title')).toHaveText(pageTitle);
  }
}

/** Administration › one of its tiles (User, Role, Category, ...). */
export async function openAdministration(page: Page, tile: string, pageTitle: string) {
  await openFromSidebar(page, 'Administration');
  await page.getByTestId(`tile-${tile.toLowerCase()}`).click();
  await expect(page.getByTestId('page-title')).toHaveText(pageTitle);
}

/** Exactly `visible` show in the sidebar; every other item is hidden. */
export async function expectSidebar(page: Page, visible: NavTitle[]) {
  for (const title of ALL_NAV_ITEMS) {
    await expect(navItem(page, title)).toHaveCount(visible.includes(title) ? 1 : 0);
  }
}

/** Opening `path` directly is refused: the user is sent back to the dashboard. */
export async function expectBlocked(page: Page, path: string) {
  await page.goto(path);
  await expect(page).toHaveURL((url) => url.pathname === '/');
  await expect(page.getByTestId('dashboard-greeting')).toBeVisible();
}
