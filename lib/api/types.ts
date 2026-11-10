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
