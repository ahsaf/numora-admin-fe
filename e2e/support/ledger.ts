import { fMoney, fShortenNumber } from './format';

// ----------------------------------------------------------------------

/** Whole cents, so sums don't drift. */
const cents = (amount: number) => Math.round(amount * 100);
const amount = (value: number) => value / 100;

type LedgerInvoice = { customer: string | null; total: number; paid: number };
type LedgerPayment = { customer: string | null; bank: string; amount: number; applied: number };

/**
 * What the books should say after each step, worked out the way the server does:
 * a customer payment settles their unpaid invoices oldest first and the rest is
 * kept as credit, which a later invoice for them uses up before anything is due.
 *
 * Every amount is dated today in a company created by the test, so these totals are
 * also what the dashboard ("This month") and the reports (this month) should show.
 */
export class Ledger {
  private banks = new Map<string, number>();

  private openingByCustomer = new Map<string, number>();

  private invoices: LedgerInvoice[] = [];

  private payments: LedgerPayment[] = [];

  private expenses: { bank: string; amount: number }[] = [];

  private transfers: { from: string; to: string; amount: number }[] = [];

  // -------------------------------------------------------------- recording

  openBank(name: string, openingBalance = 0) {
    this.banks.set(name, cents(openingBalance));
  }

  openCustomer(name: string, openingBalance = 0) {
    this.openingByCustomer.set(name, cents(openingBalance));
  }

  /** An invoice; a listed customer's credit pays what it can. Returns its index. */
  invoice(customer: string | null, total: number) {
    const row: LedgerInvoice = { customer, total: cents(total), paid: 0 };
    this.invoices.push(row);
    if (customer) {
      this.payments
        .filter((payment) => payment.customer === customer)
        .forEach((payment) => this.allocate(payment, row));
    }
    return this.invoices.length - 1;
  }

  /**
   * Money received into `bank`: against one invoice when `invoiceIndex` is given,
   * else spread over the customer's unpaid invoices oldest first.
   */
  receive(customer: string | null, bank: string, received: number, invoiceIndex?: number) {
    const payment: LedgerPayment = { customer, bank, amount: cents(received), applied: 0 };
    this.payments.push(payment);
    this.move(bank, payment.amount);
    const targets =
      invoiceIndex !== undefined
        ? [this.invoices[invoiceIndex]]
        : this.invoices.filter((row) => row.customer === customer);
    targets.forEach((row) => this.allocate(payment, row));
  }

  expense(bank: string, spent: number) {
    this.expenses.push({ bank, amount: cents(spent) });
    this.move(bank, -cents(spent));
  }

  /** Also a cash deposit, which is a transfer from a cash account into a bank. */
  transfer(from: string, to: string, moved: number) {
    this.transfers.push({ from, to, amount: cents(moved) });
    this.move(from, -cents(moved));
    this.move(to, cents(moved));
  }

  private allocate(payment: LedgerPayment, invoice: LedgerInvoice) {
    const part = Math.min(payment.amount - payment.applied, invoice.total - invoice.paid);
    if (part <= 0) return;
    payment.applied += part;
    invoice.paid += part;
  }

  private move(bank: string, change: number) {
    if (!this.banks.has(bank)) throw new Error(`Ledger: no bank account "${bank}"`);
    this.banks.set(bank, this.banks.get(bank)! + change);
  }

  // -------------------------------------------------------------- reading

  /** What the customer owes; negative when they have paid in advance. */
  customerBalance(customer: string) {
    const opening = this.openingByCustomer.get(customer) ?? 0;
    const billed = this.sum(
      this.invoices.filter((row) => row.customer === customer),
      'total'
    );
    const paid = this.sum(
      this.payments.filter((row) => row.customer === customer),
      'amount'
    );
    return amount(opening + billed - paid);
  }

  bankBalance(bank: string) {
    return amount(this.banks.get(bank) ?? 0);
  }

  /** Over the given accounts, or all of them. */
  bankTotal(banks: string[] = [...this.banks.keys()]) {
    return amount(banks.reduce((sum, bank) => sum + (this.banks.get(bank) ?? 0), 0));
  }

  get sales() {
    return amount(this.sum(this.invoices, 'total'));
  }

  get invoiceCount() {
    return this.invoices.length;
  }

  get collected() {
    return amount(this.sum(this.payments, 'amount'));
  }

  get paymentCount() {
    return this.payments.length;
  }

  /** Billed and not yet paid, over every invoice. */
  get outstanding() {
    return amount(this.sum(this.invoices, 'total') - this.sum(this.invoices, 'paid'));
  }

  get expenseTotal() {
    return amount(this.sum(this.expenses, 'amount'));
  }

  get expenseCount() {
    return this.expenses.length;
  }

  /** Expenses and transfers (deposits included), as the transaction report lists them. */
  get transactionTotal() {
    return amount(this.sum(this.expenses, 'amount') + this.sum(this.transfers, 'amount'));
  }

  get transactionCount() {
    return this.expenses.length + this.transfers.length;
  }

  private sum<T>(rows: T[], key: keyof T) {
    return rows.reduce((total, row) => total + Number(row[key]), 0);
  }
}

// ----------------------------------------------------------------------
// The app's own formatting, so expectations match what is on screen.

export const money = (value: number) => fMoney(value);

/** Dashboard widgets show totals shortened, e.g. 1.35k. */
export const short = (value: number) => fShortenNumber(value);
