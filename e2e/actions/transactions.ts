import type { Page } from '@playwright/test';

import { expect } from '@playwright/test';

import { money } from '../support/ledger';
import { openFromSidebar } from './navigation';
import { dialog, submitDialog, selectOption } from '../support/ui';

// ----------------------------------------------------------------------

async function openTransactions(page: Page) {
  if (
    !(await page
      .getByTestId('page-title')
      .filter({ hasText: /^Transactions$/ })
      .count())
  ) {
    await openFromSidebar(page, 'Transactions');
  }
}

/** The saved transaction shows up in the list. */
async function expectListed(page: Page, amount: number) {
  await expect(
    page.getByTestId('table-row').getByText(money(amount), { exact: true }).first()
  ).toBeVisible();
}

/** Transactions › Add expense: money spent from `bankAccount` under `category`. */
export async function addExpense(
  page: Page,
  {
    bankAccount,
    category,
    amount,
    remarks,
  }: {
    bankAccount: string;
    category: string;
    amount: number;
    remarks?: string;
  }
) {
  await openTransactions(page);
  await page.getByRole('button', { name: 'Add expense' }).click();

  const form = dialog(page, 'Add expense');
  await selectOption(form, 'Paid from *', bankAccount);
  await selectOption(form, 'Category *', category);
  await form.getByLabel('Amount *').fill(String(amount));
  if (remarks) await form.getByLabel('Remarks').fill(remarks);
  await submitDialog(form, 'Add expense');

  await expectListed(page, amount);
}

/** Transactions › Transfer: from one bank or cash account to another. */
export async function transferMoney(page: Page, from: string, to: string, amount: number) {
  await openTransactions(page);
  await page.getByRole('button', { name: 'Transfer', exact: true }).click();

  const form = dialog(page, 'Transfer money');
  await selectOption(form, 'From *', from);
  await selectOption(form, 'To *', to);
  await form.getByLabel('Amount *').fill(String(amount));
  await submitDialog(form, 'Transfer');

  await expectListed(page, amount);
}

/** Transactions › Deposit cash: from a cash account into a bank account. */
export async function depositCash(page: Page, fromCash: string, intoBank: string, amount: number) {
  await openTransactions(page);
  await page.getByRole('button', { name: 'Deposit cash' }).click();

  const form = dialog(page, 'Deposit cash in bank');
  await selectOption(form, 'From cash *', fromCash);
  await selectOption(form, 'Into bank *', intoBank);
  await form.getByLabel('Amount *').fill(String(amount));
  await submitDialog(form, 'Transfer');

  await expectListed(page, amount);
}
