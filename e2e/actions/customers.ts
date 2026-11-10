import type { Page } from '@playwright/test';

import { expect } from '@playwright/test';

import { money } from '../support/ledger';
import { openFromSidebar } from './navigation';
import { dialog, pickMany, startsWith, submitDialog, selectOption } from '../support/ui';

// ----------------------------------------------------------------------

export type NewCustomer = {
  name: string;
  phone?: string;
  categories?: string[];
};

/**
 * Customers › New customer: the dialog asks only the basics, then the app opens the
 * full edit form (see `completeCustomer`). Returns the customer id.
 */
export async function createCustomer(page: Page, customer: NewCustomer) {
  await openFromSidebar(page, 'Customers');
  await page.getByTestId('page-header-action').click();

  const form = page.getByTestId('party-form-dialog');
  await form.getByTestId('party-form-name').fill(customer.name);
  if (customer.phone) await form.getByTestId('party-form-phone').fill(customer.phone);
  if (customer.categories?.length) await pickMany(form, 'Categories', customer.categories);
  await form.getByTestId('party-form-submit').click();

  await expect(page).toHaveURL(/\/customers\/\d+\/edit$/);
  return Number(page.url().match(/\/customers\/(\d+)\/edit$/)![1]);
}

/**
 * On the customer's edit page: the opening balance, the catalog services (at their
 * first price) and the date billing starts; then saves and lands on the details page.
 */
export async function completeCustomer(
  page: Page,
  {
    openingBalance = 0,
    services,
    nextBillingDate,
  }: { openingBalance?: number; services: string[]; nextBillingDate: string }
) {
  await expect(page).toHaveURL(/\/customers\/\d+\/edit$/);
  await page.getByLabel(startsWith('Opening balance')).fill(String(openingBalance));
  await page.getByLabel(startsWith('Next billing start date')).fill(nextBillingDate);

  for (const [index, service] of services.entries()) {
    await page.getByRole('button', { name: index ? 'Add another service' : 'Add service' }).click();
    // The new row's selects; picking the service fills in its first price.
    await page
      .getByRole('combobox', { name: startsWith('Service') })
      .nth(index)
      .click();
    await page.getByRole('option', { name: service, exact: true }).click();
  }
  await page.getByRole('button', { name: 'Save', exact: true }).click();

  await expect(page).toHaveURL(/\/customers\/\d+$/);
  for (const service of services) {
    await expect(page.getByText(service, { exact: true }).first()).toBeVisible();
  }
}

/** Customers › search and open the customer's details page. */
export async function openCustomer(page: Page, name: string) {
  await openFromSidebar(page, 'Customers');
  await page.getByTestId('table-search').fill(name);
  await page.getByTestId('table-row').filter({ hasText: name }).first().click();
  await expect(page.getByTestId('page-title')).toHaveText(name);
}

/** On the details page: owes (positive), advance (negative) or settled. */
export async function expectCustomerBalance(page: Page, balance: number) {
  await expect(page.getByTestId('customer-balance')).toHaveText(money(Math.abs(balance)));
  await expect(page.getByTestId('customer-balance-label')).toHaveText(
    (balance > 0 && 'To receive') || (balance < 0 && 'Advance') || 'Settled'
  );
}

/** On the details page: bills each month due so far from the customer's services. */
export async function generatePendingBills(page: Page, count: number) {
  await page.getByRole('button', { name: `Generate pending bills (${count})` }).click();
  const confirm = page.getByTestId('confirm-dialog');
  await expect(confirm).toContainText(`${count} bill${count === 1 ? '' : 's'} will be created`);
  await page.getByTestId('confirm-dialog-confirm').click();

  await expect(page.getByRole('button', { name: 'All bills generated' })).toBeDisabled();
}

/**
 * On the details page: Add payment. Spread over the customer's unpaid invoices
 * oldest first; anything left stays as their credit.
 */
export async function receiveCustomerPayment(page: Page, amount: number, bankAccount: string) {
  await page.getByRole('button', { name: 'Add payment' }).click();

  const form = dialog(page, 'Receive payment');
  await form.getByLabel('Amount *').fill(String(amount));
  await selectOption(form, 'Bank account *', bankAccount);
  await submitDialog(form, 'Receive');

  await expect(
    page.getByRole('alert').filter({ hasText: `of ${money(amount)} received.` })
  ).toBeVisible();
}
