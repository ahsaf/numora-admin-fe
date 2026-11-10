import type { Page } from '@playwright/test';

import { expect } from '@playwright/test';

import { dialog, submitDialog, selectOption } from '../support/ui';
import { openAdministration } from './navigation';

// ----------------------------------------------------------------------

/** A checkbox of the permission matrix, e.g. "Customer view", "Sale create", "Account view". */
export type PermissionLabel = `${string} ${'view' | 'create' | 'edit' | 'delete'}`;

/** Administration › Role › Create role, ticking `permissions` in the matrix. */
export async function createRole(page: Page, name: string, permissions: PermissionLabel[]) {
  await openAdministration(page, 'Role', 'Roles');
  await page.getByTestId('page-header-action').click();

  const form = page.getByTestId('role-form-dialog');
  await form.getByTestId('role-form-name').fill(name);
  for (const permission of permissions) {
    await form.getByRole('checkbox', { name: permission, exact: true }).check();
  }
  await form.getByTestId('role-form-submit').click();
  await expect(form).toBeHidden();

  await expect(page.getByRole('checkbox', { name: `${name} active` })).toBeChecked();
}

/** Administration › User › Invite user. The invite stays pending until they accept. */
export async function inviteUser(page: Page, email: string, role: string) {
  await openAdministration(page, 'User', 'Users');
  await page.getByRole('button', { name: 'Invite user' }).click();

  const form = dialog(page, 'Invite user');
  await form.getByLabel('Email *').fill(email);
  await selectOption(form, 'Role *', role);
  await submitDialog(form, 'Send invite');

  const row = page.getByTestId('table-row').filter({ hasText: email });
  await expect(row).toContainText('Invite pending');
  await expect(row).toContainText(role);
}

export type CategoryType =
  | 'Product'
  | 'Service'
  | 'Customer'
  | 'Expense'
  | 'Transaction'
  | 'Vendor'
  | 'Bank Account'
  | 'All';

/** Administration › Category › add one of `type`. */
export async function createCategory(page: Page, name: string, type: CategoryType) {
  if (
    !(await page
      .getByTestId('page-title')
      .filter({ hasText: /^Categories$/ })
      .count())
  ) {
    await openAdministration(page, 'Category', 'Categories');
  }
  await page.getByTestId('page-header-action').click();

  const form = page.getByTestId('category-form-dialog');
  await form.getByTestId('category-form-name').fill(name);
  await form.getByTestId('category-form-type').getByRole('combobox').click();
  await page.getByRole('option', { name: type, exact: true }).click();
  await form.getByTestId('category-form-submit').click();
  await expect(form).toBeHidden();

  await expect(
    page.getByTestId('category-card-name').filter({ hasText: new RegExp(`^${name}$`) })
  ).toBeVisible();
}
