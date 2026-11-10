import type { Page } from '@playwright/test';

import { expect } from '@playwright/test';

import { issueVerifyToken } from '../support/db';

// ----------------------------------------------------------------------

export type Person = { name: string; email: string; password: string };

/** A new, unused identity. `name` must be letters and spaces only. */
export function newPerson(name: string): Person {
  const stamp = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const slug = name.toLowerCase().replace(/\s+/g, '.');
  return { name, email: `e2e.${slug}.${stamp}@example.com`, password: 'E2eTest@Pass1' };
}

/** Fills in sign-up and lands on "check your email". */
export async function register(page: Page, person: Person) {
  await page.goto('/sign-up');
  await page.getByTestId('sign-up-name').fill(person.name);
  await page.getByTestId('sign-up-email').fill(person.email);
  await page.getByTestId('sign-up-password').fill(person.password);
  await page.getByTestId('sign-up-confirm-password').fill(person.password);
  await page.getByTestId('sign-up-submit').click();

  await expect(page).toHaveURL(/\/verify-email-pending/);
  await expect(page.getByTestId('verify-pending-email')).toContainText(person.email);
}

/** Opens the verification link, as if clicked in the email, and goes on to sign in. */
export async function verifyEmail(page: Page, person: Person) {
  const token = issueVerifyToken(person.email);
  await page.goto(`/verify-email?token=${token}`);

  await expect(page.getByTestId('verify-email-title')).toHaveText('Email verified');
  await page.getByTestId('verify-email-sign-in').click();
  await expect(page).toHaveURL(/\/sign-in/);
}

export async function signIn(page: Page, person: Person) {
  if (!page.url().includes('/sign-in')) await page.goto('/sign-in');
  await page.getByTestId('sign-in-email').fill(person.email);
  await page.getByTestId('sign-in-password').fill(person.password);
  await page.getByTestId('sign-in-submit').click();
  await expect(page).not.toHaveURL(/\/sign-in/);
}

/** Through the account menu in the header. */
export async function signOut(page: Page) {
  await page.getByTestId('account-button').click();
  await page.getByTestId('account-logout').click();
  await expect(page).toHaveURL(/\/sign-in/);
}

/** A new account without a company is sent to set one up; creates it and lands on the dashboard. */
export async function setUpOrganisation(page: Page, companyName: string) {
  await expect(page).toHaveURL(/\/setup-organisation/);
  await page.getByTestId('setup-org-name').fill(companyName);
  await page.getByTestId('setup-org-submit').click();

  await expect(page.getByTestId('dashboard-greeting')).toBeVisible();
}

/** Accepts the pending invite from `companyName` on the setup page. */
export async function acceptInvite(page: Page, companyName: string) {
  await expect(page).toHaveURL(/\/setup-organisation/);
  const invite = page.getByTestId(/^invite-\d+$/).filter({ hasText: companyName });
  await expect(invite).toBeVisible();
  await invite.getByTestId(/^invite-accept-\d+$/).click();

  await expect(page.getByTestId('dashboard-greeting')).toBeVisible();
}
