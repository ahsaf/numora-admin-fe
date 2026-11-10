import type { Page } from '@playwright/test';

import { expect } from '@playwright/test';

import { money, short } from '../support/ledger';
import { openFromSidebar } from './navigation';

// ----------------------------------------------------------------------

export type DashboardExpectation = {
  sales: number;
  invoiceCount: number;
  collected: number;
  expenses: number;
  outstanding: number;
  /** Balance of every account the user can see, by name. */
  bankAccounts: Record<string, number>;
};

const widget = (page: Page, id: string) => page.getByTestId(id).getByTestId('widget-total');

/** Dashboard on "This month": the widgets and the bank accounts card. */
export async function expectDashboard(page: Page, expected: DashboardExpectation) {
  await openFromSidebar(page, 'Dashboard');
  await expect(page.getByTestId('dashboard-period')).toContainText('This month');
  await expect(page.getByTestId('dashboard-content')).toBeVisible();

  await expect(page.getByTestId('widget-sales').getByTestId('widget-title')).toHaveText(
    `Sales · ${expected.invoiceCount} invoices`
  );
  await expect(widget(page, 'widget-sales')).toHaveText(short(expected.sales));
  await expect(widget(page, 'widget-collected')).toHaveText(short(expected.collected));
  await expect(widget(page, 'widget-expenses')).toHaveText(short(expected.expenses));
  await expect(widget(page, 'widget-outstanding')).toHaveText(short(expected.outstanding));

  const bankCard = page.getByTestId('dashboard-bank-accounts');
  const total = Object.values(expected.bankAccounts).reduce((sum, value) => sum + value, 0);
  await expect(page.getByTestId('dashboard-bank-total')).toHaveText(money(total));
  for (const [name, balance] of Object.entries(expected.bankAccounts)) {
    await expect(bankCard.getByRole('link').filter({ hasText: name })).toContainText(
      money(balance)
    );
  }
}
