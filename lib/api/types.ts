/** Every response from thesuperappserver is wrapped by its ResponseInterceptor. */
export type ApiResponse<T> = {
  isSuccess: boolean;
  data: T;
  message?: string;
  errorCode: string | null;
};

export type Paging = {
  limit: number;
  currentPageNumber: number;
  nextPageNumber: number | null;
  previousPageNumber: number | null;
  lastPageNumber: number;
  totalCount: number;
};

export type PaginatedResponse<T> = ApiResponse<T[]> & Paging;

export type ListQuery = { page: number; limit: number; search: string };

export type AdminProfile = {
  id: number;
  name: string | null;
  email: string | null;
  username: string | null;
  avatar: string | null;
};

export type CompanyStatusFilter = 'all' | 'active' | 'inactive';

export type CompanyListItem = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  place: string | null;
  logo: string | null;
  isActive: boolean;
  createdAt: string;
  userCount: number;
  invoiceCount: number;
  ownerName: string | null;
  ownerEmail: string | null;
  subscription: { status: SubscriptionStatus; planName: string | null; endsAt: string | null };
};

export type CompanySummary = { all: number; active: number; inactive: number };

export type CompanyListResponse = PaginatedResponse<CompanyListItem> & {
  summary: CompanySummary;
};

export type CompanyDetail = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  place: string | null;
  logo: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  /** The kind of business picked at setup; null for "Other". */
  companyType: { id: number; name: string } | null;
  stats: {
    totalUsers: number;
    activeUsers: number;
    blockedUsers: number;
    customers: number;
    products: number;
    invoices: number;
    billedTotal: number;
    collectedTotal: number;
    lastInvoiceAt: string | null;
  };
};

export type CompanyUser = {
  id: number;
  name: string | null;
  email: string | null;
  username: string | null;
  phone: string | null;
  avatar: string | null;
  isEmailVerified: boolean;
  isAdmin: boolean;
  roleName: string | null;
  /** Membership in this company. */
  isActive: boolean;
  /** Blocked platform-wide. */
  isBlocked: boolean;
  joinedAt: string;
};

export type BlockedUser = {
  id: number;
  name: string | null;
  email: string | null;
  username: string | null;
  phone: string | null;
  avatar: string | null;
  createdAt: string;
  blockedAt: string;
  companies: { id: number; name: string }[];
};

export type Dashboard = {
  companies: {
    total: number;
    active: number;
    inactive: number;
    newLast30Days: number;
    engagedLast30Days: number;
    dormant: number;
  };
  users: {
    total: number;
    active: number;
    blocked: number;
    unverified: number;
    pendingOnboarding: number;
    newLast30Days: number;
  };
  usage: {
    totalInvoices: number;
    invoicesLast30Days: number;
    billedLast30Days: number;
    totalCustomers: number;
  };
  onboardingTrend: { month: string; companies: number; users: number }[];
  recentCompanies: {
    id: number;
    name: string;
    place: string | null;
    logo: string | null;
    isActive: boolean;
    createdAt: string;
    userCount: number;
  }[];
  topCompanies: {
    id: number;
    name: string;
    isActive: boolean;
    invoiceCount: number;
    billedTotal: number;
  }[];
};

// ------------------------------------------------------------- subscriptions

export enum PlanType {
  fixed = 1,
  payAsYouGo = 2,
}

export enum BillingCycle {
  trial = 0,
  monthly = 1,
  yearly = 2,
}

/** trial / active can make changes; expired (ended) and none (never subscribed) are read-only. */
export type SubscriptionStatus = 'trial' | 'active' | 'expired' | 'none';

/** Modules a plan can include (transactions, bank accounts and administration come with every plan). */
export const PLAN_FEATURES = [
  { key: 'customer', label: 'Customers' },
  { key: 'vendor', label: 'Vendors' },
  { key: 'product', label: 'Products' },
  { key: 'service', label: 'Services' },
  { key: 'report', label: 'Reports' },
] as const;
export type PlanFeature = (typeof PLAN_FEATURES)[number]['key'];

/** Records whose count a plan can limit. */
export const PLAN_RESOURCES = [
  { key: 'customer', label: 'Customers' },
  { key: 'vendor', label: 'Vendors' },
  { key: 'product', label: 'Products' },
  { key: 'service', label: 'Services' },
  { key: 'bankAccount', label: 'Bank accounts' },
  { key: 'user', label: 'Users' },
  { key: 'role', label: 'Roles' },
  { key: 'category', label: 'Categories' },
] as const;
export type PlanResource = (typeof PLAN_RESOURCES)[number]['key'];

/** Records a pay-as-you-go plan charges for each month. */
export const PAY_AS_YOU_GO_RESOURCES = [
  { key: 'customer', label: 'Customer' },
  { key: 'vendor', label: 'Vendor' },
  { key: 'product', label: 'Product' },
  { key: 'service', label: 'Service' },
  { key: 'user', label: 'User' },
  { key: 'bankAccount', label: 'Bank account' },
] as const;
export type PayAsYouGoResource = (typeof PAY_AS_YOU_GO_RESOURCES)[number]['key'];

export type Plan = {
  id: number;
  name: string;
  description: string | null;
  type: PlanType;
  monthlyPrice: number | null;
  yearlyPrice: number | null;
  features: PlanFeature[];
  /** null = unlimited */
  limits: Record<PlanResource, number | null>;
  unitPrices: Record<PayAsYouGoResource, number>;
  isTrial: boolean;
  /** Companies on it right now. */
  activeCompanies?: number;
  createdAt: string;
  updatedAt: string;
};

export type PlanInput = {
  name: string;
  description?: string | null;
  type: PlanType;
  monthlyPrice?: number | null;
  yearlyPrice?: number | null;
  features: PlanFeature[];
  limits: Partial<Record<PlanResource, number | null>>;
  unitPrices: Partial<Record<PayAsYouGoResource, number>>;
  isTrial: boolean;
};

export type SubscriptionPeriod = {
  id: number;
  plan: { id: number; name: string; type: PlanType };
  cycle: BillingCycle;
  startsAt: string;
  endsAt: string;
  amount: number;
  paymentReference: string | null;
  notes: string | null;
  cancelledAt: string | null;
  createdAt: string;
};

export type CompanySubscription = {
  status: SubscriptionStatus;
  canWrite: boolean;
  /** The running period, or the last one when expired. */
  current: SubscriptionPeriod | null;
  daysLeft: number;
  plan: Plan | null;
  usage: Record<PlanResource, number>;
  payAsYouGo: {
    lines: { resource: PayAsYouGoResource; count: number; unitPrice: number; amount: number }[];
    total: number;
  } | null;
  upcoming: SubscriptionPeriod[];
  history: SubscriptionPeriod[];
};

export type ActivateSubscriptionInput = {
  planId: number;
  cycle: BillingCycle.monthly | BillingCycle.yearly;
  amount?: number;
  startNow?: boolean;
  paymentReference?: string;
  notes?: string;
};

export enum SubscriptionRequestStatus {
  pending = 0,
  handled = 1,
  dismissed = 2,
}

export type SubscriptionRequestFilter = 'pending' | 'handled' | 'dismissed' | 'all';

/** A company asking for a plan from the web app's subscription page. */
export type SubscriptionRequest = {
  id: number;
  company: { id: number; name: string; email: string | null; phone: string | null };
  plan: { id: number; name: string; type: PlanType };
  cycle: BillingCycle;
  message: string | null;
  status: SubscriptionRequestStatus;
  requestedBy: { name: string | null; email: string | null; phone: string | null } | null;
  handledAt: string | null;
  createdAt: string;
};

export type SubscriptionRequestListResponse = PaginatedResponse<SubscriptionRequest> & {
  pendingCount: number;
};

/** Platform-wide settings; an empty string means not set. */
export type PlatformSettings = {
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  /** Comma-separated. Empty: contactEmail, then every super admin. */
  requestNotifyEmails: string;
};

// ------------------------------------------------------------ company types

/** One field's settings as a company changes them; missing keys keep the default. */
export type FieldOverride = {
  label?: string;
  validation?: string;
  maxLength?: number;
  isRequired?: boolean;
  isActive?: boolean;
};

export type TemplateModule = { module: string; isActive: boolean };
export type TemplateCategory = { name: string; color: string; type: number };
export type TemplateRole = { name: string; permissionKeys: string[] };

/** A kind of business, and the setup a new company of that kind starts with. */
export type CompanyType = {
  id: number;
  name: string;
  description: string | null;
  sortOrder: number;
  /** Offered at setup. */
  isActive: boolean;
  /** Every module, in sidebar order. */
  modules: TemplateModule[];
  /** Only what differs from the defaults, by form then field key. */
  formFields: Record<string, Record<string, FieldOverride>>;
  categories: TemplateCategory[];
  roles: TemplateRole[];
  /** Companies set up as this type. */
  companies?: number;
  createdAt: string;
  updatedAt: string;
};

export type FormFieldSettingInput = {
  key: string;
  label: string;
  isRequired: boolean;
  isActive: boolean;
};

export type CompanyTypeInput = {
  name: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  modules: TemplateModule[];
  formFields: { form: string; fields: FormFieldSettingInput[] }[];
  categories: TemplateCategory[];
  roles: TemplateRole[];
};

export type CompanyTypeFieldDef = {
  key: string;
  label: string;
  kind: string;
  required: boolean;
  /** Always on and required. */
  locked: boolean;
  /** Always has a value, so it can't be made required. */
  noRequired: boolean;
};

/** What a company type can set, from the server. */
export type CompanyTypeOptions = {
  modules: { key: string; label: string; isLocked: boolean }[];
  forms: { key: string; label: string; fields: CompanyTypeFieldDef[] }[];
  permissionModules: { key: string; label: string }[];
  permissionActions: { key: string; label: string }[];
  categoryTypes: { value: number; label: string }[];
};
