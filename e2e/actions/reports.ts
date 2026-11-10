import type { Page } from '@playwright/test';

import { expect } from '@playwright/test';

import { money } from '../support/ledger';
import { openFromSidebar } from './navigation';

// ----------------------------------------------------------------------

export type ReportTitle = 'Collection report' | 'Transaction report' | 'Expense report';

/**
 * Reports › `title` › Generate with the default filters (this month, everything),
 * then checks the row count and the Amount total in the totals row.
 */
export async function expectReport(
  page: Page,
  title: ReportTitle,
  expected: { rows: number; total: number }
) {
  await openFromSidebar(page, 'Reports');
  await page.getByTestId(`tile-${title.toLowerCase()}`).click();
  await expect(page.getByTestId('page-title')).toHaveText(title);

  await page.getByRole('button', { name: 'Generate', exact: true }).click();

  const totals = page.getByRole('row').filter({ hasText: `Total (${expected.rows})` });
  await expect(totals).toBeVisible();
  // Amount is the last money column shown by default in every report.
  await expect(totals.getByRole('cell').last()).toHaveText(money(expected.total));
}
