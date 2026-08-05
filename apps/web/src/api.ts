// Every call goes to the Worker API on its own domain, so credentials:
// "include" is required for the session cookie to be sent — plain
// same-origin defaults won't do that.
const API_URL = import.meta.env.VITE_API_URL ?? "";

export interface Client {
  id: number;
  name: string;
  first_invoice_date: string | null;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options.headers },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}) as { error?: string });
    throw new Error(body.error ?? `Something went wrong (${res.status})`);
  }

  return res.json() as Promise<T>;
}

export function getSetupStatus(): Promise<{ completed: boolean }> {
  return request("/api/setup/status");
}

export function setup(email: string, password: string): Promise<{ email: string }> {
  return request("/api/setup", { method: "POST", body: JSON.stringify({ email, password }) });
}

export function login(email: string, password: string): Promise<{ email: string }> {
  return request("/api/login", { method: "POST", body: JSON.stringify({ email, password }) });
}

export function register(email: string, password: string, inviteCode: string): Promise<{ email: string }> {
  return request("/api/register", { method: "POST", body: JSON.stringify({ email, password, inviteCode }) });
}

export function logout(): Promise<{ ok: boolean }> {
  return request("/api/logout", { method: "POST" });
}

export function me(): Promise<{ email: string }> {
  return request("/api/me");
}

export function getClients(): Promise<Client[]> {
  return request("/api/clients");
}

export function addClient(name: string): Promise<Client> {
  return request("/api/clients", { method: "POST", body: JSON.stringify({ name }) });
}

export interface Invoice {
  id: number;
  invoiceDate: string;
  clientId: number;
  clientName: string;
  totalAmount: number;
  anitaIncome: number;
  status: string;
  reference: string | null;
  matter: string | null;
  batchId: number | null;
  dateSettledClient: string | null;
  dateSettledFirm: string | null;
  lagDays: number | null;
}

export function getInvoices(): Promise<Invoice[]> {
  return request("/api/invoices");
}

export function addInvoice(input: {
  invoiceDate: string;
  clientId: number;
  totalAmount: number;
  reference?: string;
  matter?: string;
}): Promise<Invoice> {
  return request("/api/invoices", { method: "POST", body: JSON.stringify(input) });
}

export function updateInvoice(
  id: number,
  patch: Partial<{
    invoiceDate: string;
    clientId: number;
    totalAmount: number;
    reference: string | null;
    matter: string | null;
    status: string;
    dateSettledClient: string | null;
    dateSettledFirm: string | null;
  }>,
): Promise<Invoice> {
  return request(`/api/invoices/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
}

export function deleteInvoice(id: number): Promise<{ ok: boolean }> {
  return request(`/api/invoices/${id}`, { method: "DELETE" });
}

export interface TaxYearSettings {
  startYear: number;
  taxYear: string;
  startDate: string;
  monthlyTarget: number | null;
  splitPercentage: number | null;
}

export function getTaxYearSettings(startYear: number): Promise<TaxYearSettings> {
  return request(`/api/tax-year-settings/${startYear}`);
}

export function setTaxYearTarget(startYear: number, monthlyTarget: number): Promise<TaxYearSettings> {
  return request(`/api/tax-year-settings/${startYear}`, {
    method: "POST",
    body: JSON.stringify({ monthlyTarget }),
  });
}

export interface Firm {
  id: number;
  name: string;
  contactEmail: string | null;
  contactAddress: string | null;
  contactPostcode: string | null;
  contactPhone: string | null;
}

export function getFirms(): Promise<Firm[]> {
  return request("/api/firms");
}

export function updateFirm(
  id: number,
  patch: Partial<{
    contactEmail: string | null;
    contactAddress: string | null;
    contactPostcode: string | null;
    contactPhone: string | null;
  }>,
): Promise<Firm> {
  return request(`/api/firms/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
}

export interface InvoiceSettings {
  fromName: string;
  fromEmail: string;
  fromAddress: string;
  fromPostcode: string;
  fromPhone: string;
  bankAccountName: string;
  bankSortCode: string;
  bankAccountNumber: string;
  referencePrefix: string;
  nextReferenceNumber: number;
}

export function getInvoiceSettings(): Promise<InvoiceSettings> {
  return request("/api/invoice-settings");
}

export function updateInvoiceSettings(settings: InvoiceSettings): Promise<InvoiceSettings> {
  return request("/api/invoice-settings", { method: "PUT", body: JSON.stringify(settings) });
}

export interface InvoiceBatchSummary {
  id: number;
  reference: string;
  invoiceDate: string;
  totalFee: number;
  totalAmountDue: number;
  billToName: string;
  createdAt: string;
}

export interface InvoiceBatchLineItem {
  id: number;
  invoiceDate: string;
  fileNo: string | null;
  matter: string | null;
  clientName: string;
  totalAmount: number;
  anitaIncome: number;
}

export interface InvoiceBatchDetail {
  id: number;
  reference: string;
  invoiceDate: string;
  totalFee: number;
  totalAmountDue: number;
  createdAt: string;
  from: { name: string; email: string; address: string; postcode: string; phone: string };
  billTo: { name: string; email: string; address: string; postcode: string; phone: string };
  bank: { accountName: string; sortCode: string; accountNumber: string };
  lineItems: InvoiceBatchLineItem[];
}

export function getInvoiceBatches(): Promise<InvoiceBatchSummary[]> {
  return request("/api/invoice-batches");
}

export function getInvoiceBatch(id: number): Promise<InvoiceBatchDetail> {
  return request(`/api/invoice-batches/${id}`);
}

export function createInvoiceBatch(input: {
  invoiceIds: number[];
  firmId: number;
  invoiceDate: string;
}): Promise<InvoiceBatchDetail> {
  return request("/api/invoice-batches", { method: "POST", body: JSON.stringify(input) });
}

export interface ExpenseCategory {
  id: number;
  name: string;
}

export function getExpenseCategories(): Promise<ExpenseCategory[]> {
  return request("/api/expense-categories");
}

export function addExpenseCategory(name: string): Promise<ExpenseCategory> {
  return request("/api/expense-categories", { method: "POST", body: JSON.stringify({ name }) });
}

export function renameExpenseCategory(id: number, name: string): Promise<ExpenseCategory> {
  return request(`/api/expense-categories/${id}`, { method: "PATCH", body: JSON.stringify({ name }) });
}

// reassignToId: where this category's existing expenses go once it's
// gone — another category's id, or null to leave them uncategorised.
export function deleteExpenseCategory(id: number, reassignToId: number | null): Promise<{ ok: boolean }> {
  return request(`/api/expense-categories/${id}`, {
    method: "DELETE",
    body: JSON.stringify({ reassignToId }),
  });
}

export interface Expense {
  id: number;
  date: string;
  description: string;
  cost: number;
  categoryId: number | null;
  category: string | null;
}

export function getExpenses(): Promise<Expense[]> {
  return request("/api/expenses");
}

export function addExpense(input: {
  date: string;
  description: string;
  cost: number;
  categoryId?: number | null;
}): Promise<Expense> {
  return request("/api/expenses", { method: "POST", body: JSON.stringify(input) });
}

export function updateExpense(
  id: number,
  patch: Partial<{ date: string; description: string; cost: number; categoryId: number | null }>,
): Promise<Expense> {
  return request(`/api/expenses/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
}

export function deleteExpense(id: number): Promise<{ ok: boolean }> {
  return request(`/api/expenses/${id}`, { method: "DELETE" });
}

export interface AccountSettings {
  inviteCode: string;
}

export function getAccountSettings(): Promise<AccountSettings> {
  return request("/api/account-settings");
}

export function updateAccountSettings(inviteCode: string): Promise<AccountSettings> {
  return request("/api/account-settings", { method: "PUT", body: JSON.stringify({ inviteCode }) });
}
