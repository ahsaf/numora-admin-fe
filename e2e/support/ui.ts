import type { Page, Locator } from '@playwright/test';

import { expect } from '@playwright/test';

// ----------------------------------------------------------------------
// Small helpers for MUI controls, found by their visible labels.

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Text starting with `text`; MUI selects append the picked value to their name. */
export const startsWith = (text: string) => new RegExp(`^${escape(text)}`);

const pageOf = (scope: Page | Locator): Page => ('page' in scope ? scope.page() : scope);

/** Today as "YYYY-MM-DD" in local time, as the app's date fields use. */
export const today = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
};

/** Opens the MUI select labelled `label` and picks the option starting with `option`. */
export async function selectOption(scope: Page | Locator, label: string, option: string) {
  await scope.getByRole('combobox', { name: startsWith(label) }).click();
  const listbox = pageOf(scope).getByRole('listbox');
  await listbox.getByRole('option', { name: startsWith(option) }).click();
  await expect(listbox).toBeHidden();
}

/** Adds `options` to a multi-select Autocomplete (e.g. categories), then closes its list. */
export async function pickMany(scope: Page | Locator, label: string, options: string[]) {
  const input = scope.getByRole('combobox', { name: label, exact: true });
  for (const option of options) {
    await input.fill(option);
    await pageOf(scope).getByRole('option', { name: option, exact: true }).click();
  }
  await input.press('Escape');
}

/** The open MUI dialog titled `title`. */
export const dialog = (page: Page, title: string) =>
  page.getByRole('dialog').filter({ has: page.getByRole('heading', { name: title }) });

/** Submits the dialog with `button` and waits for it to close. */
export async function submitDialog(scope: Locator, button: string) {
  await scope.getByRole('button', { name: button, exact: true }).click();
  await expect(scope).toBeHidden();
}
