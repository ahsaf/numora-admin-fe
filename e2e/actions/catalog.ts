import type { Page } from '@playwright/test';

import { expect } from '@playwright/test';

import { pickMany } from '../support/ui';
import { openFromSidebar } from './navigation';

// ----------------------------------------------------------------------

export type CatalogItem = {
  name: string;
  /** Sell prices; the first is what invoices and customers start with. */
  prices: { label: string; price: number }[];
  categories?: string[];
};

/** Products › New product (or Services › New service), then its details page. */
async function createItem(page: Page, kind: 'Products' | 'Services', item: CatalogItem) {
  await openFromSidebar(page, kind);
  await page.getByTestId('page-header-action').click();
  await expect(page.getByTestId('page-title')).toHaveText(
    kind === 'Products' ? 'New product' : 'New service'
  );

  await page.getByTestId('product-form-name').fill(item.name);
  if (item.categories?.length) {
    await pickMany(page.getByTestId('product-form'), 'Categories', item.categories);
  }
  for (const [index, price] of item.prices.entries()) {
    if (index > 0) await page.getByTestId('product-form-add-price').click();
    await page.getByTestId(`price-label-${index}`).fill(price.label);
    await page.getByTestId(`price-amount-${index}`).fill(String(price.price));
  }
  await page.getByTestId('product-form-submit').click();

  await expect(page.getByTestId('page-title')).toHaveText(item.name);
}

export const createProduct = (page: Page, item: CatalogItem) => createItem(page, 'Products', item);

export const createService = (page: Page, item: CatalogItem) => createItem(page, 'Services', item);
