/**
 * Copies of the web app's formatters (thesuperappweb `src/utils/format-number.ts`), so
 * expected values are written exactly as the app shows them. Keep in sync if the app's
 * number formatting changes.
 */

type InputNumberValue = string | number | null | undefined;

const LOCALE = 'en-US';

function processInput(inputValue: InputNumberValue): number | null {
  if (inputValue == null || Number.isNaN(inputValue)) return null;
  return Number(inputValue);
}

export function fNumber(inputValue: InputNumberValue, options?: Intl.NumberFormatOptions) {
  const number = processInput(inputValue);
  if (number === null) return '';
  return new Intl.NumberFormat(LOCALE, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options,
  }).format(number);
}

/** Dashboard widgets: totals shortened, e.g. "1.35k". */
export function fShortenNumber(inputValue: InputNumberValue, options?: Intl.NumberFormatOptions) {
  const number = processInput(inputValue);
  if (number === null) return '';
  const fm = new Intl.NumberFormat(LOCALE, {
    notation: 'compact',
    maximumFractionDigits: 2,
    ...options,
  }).format(number);
  return fm.replace(/[A-Z]/g, (match) => match.toLowerCase());
}

/** Money amount with 2 decimals and no currency symbol, e.g. "1,200.00". */
export function fMoney(inputValue: InputNumberValue) {
  return fNumber(inputValue, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
