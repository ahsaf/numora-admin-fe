import { test } from '@playwright/test';

import { Ledger } from '../support/ledger';
import { today } from '../support/ui';
import { expectReport } from '../actions/reports';
import { expectDashboard } from '../actions/dashboard';
import { createCustomerInvoice } from '../actions/invoices';
import { createProduct, createService } from '../actions/catalog';
import { addExpense, depositCash, transferMoney } from '../actions/transactions';
import { createRole, inviteUser, createCategory } from '../actions/administration';
import { expectBlocked, expectSidebar, openAdministration } from '../actions/navigation';
import {
  signIn,
  signOut,
  register,
  newPerson,
  verifyEmail,
  acceptInvite,
  setUpOrganisation,
} from '../actions/auth';
import {
  createBankAccount,
  expectBankBalances,
  expectBankAccountPage,
} from '../actions/bank-accounts';
import {
  openCustomer,
  createCustomer,
  completeCustomer,
  generatePendingBills,
  expectCustomerBalance,
  receiveCustomerPayment,
} from '../actions/customers';

// ----------------------------------------------------------------------

const ROLE = 'Collection Agent';

const MAIN = 'Main Bank';
const SAVINGS = 'Savings Bank';
const CASH = 'Petty Cash';
const WALLET = 'Agent Wallet';

const PRODUCT = 'Water Can';
const SERVICE = 'Fiber Internet';
const CUSTOMER = 'Acme Stores';

const FUEL = 'Fuel';

test('a new company bills, collects and moves money, with a collection agent', async ({ page }) => {
  const admin = newPerson('Alice Admin');
  const agent = newPerson('Carl Collector');
  const company = `E2E Traders ${Date.now()}`;
  /** What every balance and total should be, updated alongside each step. */
  const books = new Ledger();

  const allBalances = (names: string[]) =>
    Object.fromEntries(names.map((name) => [name, books.bankBalance(name)]));

  await test.step('1-3. open the app, register and verify the email', async () => {
    await register(page, admin);
    await verifyEmail(page, admin);
    await signIn(page, admin);
  });

  await test.step('4. add the company info', async () => {
    await setUpOrganisation(page, company);
  });

  await test.step('5-6. Administration › Role: add a role for collection agents', async () => {
    await openAdministration(page, 'Role', 'Roles');
    // Bill customers and take their payments into their own accounts; nothing else.
    await createRole(page, ROLE, [
      'Customer view',
      'Sale view',
      'Sale create',
      'Account view',
      'Account create',
    ]);
  });

  await test.step('7. invite the collection agent', async () => {
    await inviteUser(page, agent.email, ROLE);
  });

  await test.step('8. add categories', async () => {
    await openAdministration(page, 'Category', 'Categories');
    await createCategory(page, 'Beverages', 'Product');
    await createCategory(page, 'Broadband', 'Service');
    await createCategory(page, 'Retail', 'Customer');
    await createCategory(page, FUEL, 'Expense');
  });

  await test.step('9. add a bank account', async () => {
    await createBankAccount(page, MAIN, 10_000);
    books.openBank(MAIN, 10_000);
  });

  await test.step('9b. add a product and a service', async () => {
    await createProduct(page, {
      name: PRODUCT,
      prices: [{ label: 'Retail', price: 50 }],
      categories: ['Beverages'],
    });
    await createService(page, {
      name: SERVICE,
      prices: [{ label: 'Monthly', price: 1_000 }],
      categories: ['Broadband'],
    });
  });

  await test.step('10. add a customer with the service', async () => {
    await createCustomer(page, { name: CUSTOMER, phone: '501234567', categories: ['Retail'] });
    books.openCustomer(CUSTOMER, 0);
    await completeCustomer(page, { services: [SERVICE], nextBillingDate: today() });
    await expectCustomerBalance(page, 0);
  });

  await test.step('11. generate the bill', async () => {
    await generatePendingBills(page, 1);
    books.invoice(CUSTOMER, 1_000);
    await expectCustomerBalance(page, books.customerBalance(CUSTOMER));
  });

  await test.step('12. collect a payment', async () => {
    await receiveCustomerPayment(page, 600, MAIN);
    books.receive(CUSTOMER, MAIN, 600);
  });

  await test.step('13. customer and bank balances are updated', async () => {
    await expectCustomerBalance(page, books.customerBalance(CUSTOMER)); // 400
    await expectBankBalances(page, allBalances([MAIN])); // 10,600
  });

  await test.step('14. more invoices and payments keep the balances right', async () => {
    await openCustomer(page, CUSTOMER);

    // Billed now, paid later.
    const cans = await createCustomerInvoice(
      page,
      CUSTOMER,
      [{ product: PRODUCT, quantity: 4 }],
      'later'
    );
    books.invoice(CUSTOMER, cans); // 200
    await expectCustomerBalance(page, books.customerBalance(CUSTOMER)); // 600

    // Paid in full while invoicing.
    const delivery = await createCustomerInvoice(
      page,
      CUSTOMER,
      [{ item: 'Delivery charge', price: 150, quantity: 1 }],
      { bankAccount: MAIN }
    );
    books.receive(CUSTOMER, MAIN, delivery, books.invoice(CUSTOMER, delivery));
    await expectCustomerBalance(page, books.customerBalance(CUSTOMER)); // 600

    // Settles the bill (400 due) and half of the cans invoice, oldest first.
    await receiveCustomerPayment(page, 500, MAIN);
    books.receive(CUSTOMER, MAIN, 500);
    await expectCustomerBalance(page, books.customerBalance(CUSTOMER)); // 100

    await expectBankBalances(page, allBalances([MAIN])); // 11,250
  });

  await test.step('15. an expense comes out of the bank account', async () => {
    await addExpense(page, { bankAccount: MAIN, category: FUEL, amount: 250, remarks: 'Van' });
    books.expense(MAIN, 250);
    await expectBankBalances(page, allBalances([MAIN])); // 11,000
  });

  await test.step('16. a second bank account and a transfer between them', async () => {
    await createBankAccount(page, SAVINGS, 5_000);
    books.openBank(SAVINGS, 5_000);
    await transferMoney(page, MAIN, SAVINGS, 2_000);
    books.transfer(MAIN, SAVINGS, 2_000);
    await expectBankBalances(page, allBalances([MAIN, SAVINGS])); // 9,000 / 7,000
  });

  await test.step('17. a cash account funded by a transfer', async () => {
    await createBankAccount(page, CASH, 0, 'Cash');
    books.openBank(CASH, 0);
    await transferMoney(page, MAIN, CASH, 1_000);
    books.transfer(MAIN, CASH, 1_000);
    await expectBankBalances(page, allBalances([MAIN, SAVINGS, CASH])); // 8,000 / 7,000 / 1,000
  });

  await test.step('18. deposit cash into the bank', async () => {
    await depositCash(page, CASH, SAVINGS, 400);
    books.transfer(CASH, SAVINGS, 400);
    await expectBankBalances(page, allBalances([MAIN, SAVINGS, CASH])); // 8,000 / 7,400 / 600
    await expectBankAccountPage(page, SAVINGS, books.bankBalance(SAVINGS));
  });

  await test.step('19. the dashboard adds up', async () => {
    await expectDashboard(page, {
      sales: books.sales,
      invoiceCount: books.invoiceCount,
      collected: books.collected,
      expenses: books.expenseTotal,
      outstanding: books.outstanding,
      bankAccounts: allBalances([MAIN, SAVINGS, CASH]),
    });
  });

  await test.step('20. every report adds up', async () => {
    await expectReport(page, 'Collection report', {
      rows: books.paymentCount,
      total: books.collected,
    });
    await expectReport(page, 'Transaction report', {
      rows: books.transactionCount,
      total: books.transactionTotal,
    });
    await expectReport(page, 'Expense report', {
      rows: books.expenseCount,
      total: books.expenseTotal,
    });
  });

  await test.step('21. the collection agent registers and accepts the invite', async () => {
    await signOut(page);
    await register(page, agent);
    await verifyEmail(page, agent);
    await signIn(page, agent);
    await acceptInvite(page, company);
  });

  await test.step('22. the agent adds their own bank account', async () => {
    await createBankAccount(page, WALLET, 0);
    books.openBank(WALLET, 0);
    // The company's other accounts are not given to the agent.
    await expectBankBalances(page, allBalances([WALLET]));
  });

  await test.step('23. the agent invoices and collects', async () => {
    await openCustomer(page, CUSTOMER);
    await expectCustomerBalance(page, books.customerBalance(CUSTOMER)); // 100

    const cans = await createCustomerInvoice(page, CUSTOMER, [{ product: PRODUCT, quantity: 2 }], {
      bankAccount: WALLET,
    });
    books.receive(CUSTOMER, WALLET, cans, books.invoice(CUSTOMER, cans));

    await receiveCustomerPayment(page, 100, WALLET);
    books.receive(CUSTOMER, WALLET, 100);
  });

  await test.step('24. customer and agent account balances are updated', async () => {
    await expectCustomerBalance(page, books.customerBalance(CUSTOMER)); // settled
    await expectBankBalances(page, allBalances([WALLET])); // 200
  });

  await test.step('25. the agent only has the modules of their role', async () => {
    await expectSidebar(page, ['Dashboard', 'Customers', 'Bank accounts']);
    for (const path of ['/administration', '/reports', '/transactions', '/products', '/vendors']) {
      await expectBlocked(page, path);
    }
  });

  await test.step("26-28. the agent signs out; the admin signs in and has the agent's account", async () => {
    await signOut(page);
    await signIn(page, admin);
    // Admins always have access to every account, and the access picker doesn't offer
    // them, so nothing has to be granted: the agent's account is already the admin's
    // to use, with the agent listed as its user.
    await expectBankAccountPage(page, WALLET, books.bankBalance(WALLET), [agent.name]);
  });

  await test.step('29. the admin collects into the shared account', async () => {
    await openCustomer(page, CUSTOMER);
    // Nothing is due, so it is all kept as the customer's advance.
    await receiveCustomerPayment(page, 250, WALLET);
    books.receive(CUSTOMER, WALLET, 250);
    await expectCustomerBalance(page, books.customerBalance(CUSTOMER)); // advance 250

    await expectBankAccountPage(page, WALLET, books.bankBalance(WALLET)); // 450
    await expectBankBalances(page, allBalances([MAIN, SAVINGS, CASH, WALLET]));
    await expectDashboard(page, {
      sales: books.sales,
      invoiceCount: books.invoiceCount,
      collected: books.collected,
      expenses: books.expenseTotal,
      outstanding: books.outstanding,
      bankAccounts: allBalances([MAIN, SAVINGS, CASH, WALLET]),
    });
  });
});
