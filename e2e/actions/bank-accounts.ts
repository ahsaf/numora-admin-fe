import type { Page } from '@playwright/test';

import { expect } from '@playwright/test';

import { money } from '../support/ledger';
import { openFromSidebar } from './navigation';

// ----------------------------------------------------------------------

export type BankAccountKind = 'Bank account' | 'Cash';

async function openBankAccounts(page: Page) {
  await openFromSidebar(page, 'Bank accounts');
}

const card = (page: Page, name: string) =>
  page.getByTestId('record-card').filter({ has: page.getByRole('link', { name, exact: true }) });

/** Bank accounts › add a bank (or cash) account with its opening balance. */
export async function createBankAccount(
  page: Page,
  name: string,
  openingBalance: number,
  kind: BankAccountKind = 'Bank account'
) {
  await openBankAccounts(page);
  await page.getByTestId('page-header-action').click();

  const form = page.getByTestId('name-amount-dialog');
  await form.getByTestId('name-amount-name').fill(name);
  await form.getByTestId('name-amount-amount').fill(String(openingBalance));
  if (kind !== 'Bank account') {
    await form.getByTestId('bank-account-type').getByRole('combobox').click();
    await page.getByRole('option', { name: kind, exact: true }).click();
  }
  await form.getByTestId('name-amount-submit').click();
  await expect(form).toBeHidden();

  await expect(card(page, name).getByTestId('record-card-amount')).toHaveText(
    money(openingBalance)
  );
}

/**
 * On Bank accounts: each account in `balances` shows that balance, and the total is
 * theirs summed. `balances` must list every account the user can see.
 */
export async function expectBankBalances(page: Page, balances: Record<string, number>) {
  await openBankAccounts(page);
  const names = Object.keys(balances);
  await expect(page.getByTestId('record-card')).toHaveCount(names.length);
  for (const name of names) {
    await expect(card(page, name).getByTestId('record-card-amount')).toHaveText(
      money(balances[name])
    );
  }
  const total = Object.values(balances).reduce((sum, value) => sum + value, 0);
  await expect(page.getByTestId('bank-accounts-total')).toHaveText(money(total));
}

/**
 * Opens the account's own page and checks its balance and, when given, the users
 * listed under "Users with access" (company admins always have access and aren't listed).
 */
export async function expectBankAccountPage(
  page: Page,
  name: string,
  balance: number,
  usersWithAccess?: string[]
) {
  await openBankAccounts(page);
  await card(page, name).getByRole('link', { name, exact: true }).click();
  await expect(page.getByTestId('page-title')).toHaveText(name);
  await expect(page.getByTestId('bank-account-balance')).toHaveText(money(balance));

  if (usersWithAccess) {
    const access = page
      .locator('.MuiCard-root')
      .filter({ has: page.getByText('Users with access', { exact: true }) });
    for (const user of usersWithAccess) {
      await expect(access.getByText(user, { exact: true })).toBeVisible();
    }
  }
}
