import type { Page } from '@playwright/test';

import { expect } from '@playwright/test';

import { money } from '../support/ledger';
import { dialog, startsWith, submitDialog, selectOption } from '../support/ui';

// ----------------------------------------------------------------------

export type InvoiceLine =
  /** A catalog product at its first price. */
  | { product: string; quantity: number }
  /** An item typed in with its own price. */
  | { item: string; price: number; quantity: number };

export type InvoicePayment =
  /** Paid now, into `bankAccount`; `amount` defaults to the whole due. */
  | { bankAccount: string; amount?: number }
  /** Left unpaid ("Pay later"). */
  | 'later'
  /** Nothing to pay, e.g. the customer's credit settled it. */
  | 'none';

/**
 * From the customer's details page: Add invoice, add the product lines, create it and
 * pay it (or not), then back to the customer. Returns the invoice total.
 */
export async function createCustomerInvoice(
  page: Page,
  customer: string,
  lines: InvoiceLine[],
  payment: InvoicePayment
) {
  await page.getByRole('link', { name: 'Add invoice' }).click();
  await expect(page.getByTestId('page-title')).toHaveText('New invoice');
  await expect(page.getByRole('combobox', { name: startsWith('Customer') })).toHaveValue(customer);

  let total = 0;
  for (const line of lines) {
    const name = page.getByRole('combobox', { name: startsWith('Product') });
    if ('product' in line) {
      await name.fill(line.product);
      await page
        .getByRole('option', { name: startsWith(line.product) })
        .first()
        .click();
    } else {
      await name.fill(line.item);
      await name.press('Escape');
      await page.getByLabel('Price *').fill(String(line.price));
    }
    await page.getByLabel('Qty *').fill(String(line.quantity));
    const amount = page.getByLabel('Amount', { exact: true });
    await expect(amount).not.toHaveValue('');
    total += Number((await amount.inputValue()).replace(/,/g, ''));
    await page.getByRole('button', { name: 'Add', exact: true }).click();
  }
  await expect(page.getByText(money(total), { exact: true }).last()).toBeVisible();

  await page.getByRole('button', { name: 'Create invoice' }).click();

  if (payment !== 'none') {
    const form = dialog(page, 'Receive payment');
    await expect(form).toContainText(`Due ${money(total)}`);
    if (payment === 'later') {
      await submitDialog(form, 'Pay later');
    } else {
      if (payment.amount !== undefined)
        await form.getByLabel('Amount *').fill(String(payment.amount));
      await selectOption(form, 'Bank account *', payment.bankAccount);
      await submitDialog(form, 'Receive');
    }
  }

  // Readable once the payment dialog is closed.
  const success = page.getByRole('alert').filter({ hasText: `for ${customer} created` });
  await expect(success).toContainText(money(total));
  if (typeof payment === 'object') {
    await expect(success).toContainText(`${money(payment.amount ?? total)} received`);
  }

  await page.getByTestId('page-back').click();
  await expect(page.getByTestId('page-title')).toHaveText(customer);
  return total;
}
