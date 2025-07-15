// Analytics Types
export interface AnalyticsSummary {
  totalUrls: number;
  totalClicks: number;
  uniqueClicks: number;
  clicksInPeriod: number;
  avgClicksPerUrl: number;
  clickRate: number;
}

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface ComparisonData {
  current: number;
  previous: number;
  change: number;
  changePercentage: number;
}

export interface DashboardAnalytics {
  summary: AnalyticsSummary;
  comparison?: {
    clicks?: ComparisonData;
    uniqueClicks?: ComparisonData;
    urls?: ComparisonData;
  };
  charts: {
    clicksOverTime: Array<{ date: string; clicks: number; uniqueClicks: number }>;
    topUrls: Array<{
      id: string;
      shortCode: string;
      title: string;
      originalUrl: string;
      clicks: number;
      uniqueClicks: number;
      createdAt: string;
    }>;
    topCountries: Array<{ country: string; clicks: number; percentage: number }>;
    topCities: Array<{ country: string; city: string; clicks: number; percentage: number }>;
    topReferrers: Array<{ referrer: string; domain: string; clicks: number; percentage: number }>;
    topDevices: Array<{ device: string; clicks: number; percentage: number }>;
    topBrowsers: Array<{ browser: string; clicks: number; percentage: number }>;
  };
}

export interface UrlAnalytics {
  url: {
    id: string;
    shortCode: string;
    originalUrl: string;
    title: string;
    createdAt: string;
  };
  summary: {
    totalClicks: number;
    uniqueClicks: number;
    avgClicksPerDay: number;
    peakDay: { date: string; clicks: number };
    firstClick: string;
    lastClick: string;
  };
  charts: {
    clicksOverTime: Array<{ date: string; clicks: number; uniqueClicks: number }>;
    topCountries: Array<{ country: string; clicks: number; percentage: number }>;
    topCities: Array<{ country: string; city: string; clicks: number; percentage: number }>;
    topReferrers: Array<{ referrer: string; domain: string; clicks: number; percentage: number }>;
    topDevices: Array<{ device: string; clicks: number; percentage: number }>;
    topBrowsers: Array<{ browser: string; clicks: number; percentage: number }>;
    hourlyDistribution: Array<{ hour: number; clicks: number }>;
    weeklyDistribution: Array<{ day: string; clicks: number }>;
  };
}

// User & Authentication Types
export interface User {
  id: string;
  email: string;
  name: string | null;
  plan: 'FREE' | 'PRO' | 'ENTERPRISE';
  isActive: boolean;
  isVerified: boolean;
  lastLogin: string | null;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name?: string;
}

// URL Types
export interface Url {
  id: string;
  originalUrl: string;
  shortCode: string;
  shortUrl?: string;
  title: string | null;
  description: string | null;
  password: boolean; // Indicates if URL is password protected
  expiresAt: string | null;
  isActive: boolean;
  userId: string | null;
  createdAt: string;
  updatedAt: string;
  clickCount?: number; // Optional, populated when needed
}

export interface CreateUrlData {
  originalUrl: string;
  customCode?: string;
  title?: string;
  description?: string;
  password?: string;
  expiresAt?: string;
}

export interface UpdateUrlData {
  title?: string;
  description?: string;
  password?: string;
  expiresAt?: string;
  isActive?: boolean;
}

// Subscription Types
export interface Subscription {
  id: string;
  userId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string | null;
  plan: 'FREE' | 'PRO' | 'ENTERPRISE';
  status: 'active' | 'inactive' | 'canceled' | 'past_due' | 'unpaid';
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean | null;
  createdAt: string;
  updatedAt: string;
}

export interface PlanFeatures {
  maxUrls: number;
  maxClicksPerMonth: number;
  analyticsRetention: number; // days, -1 for unlimited
  customDomains: boolean;
  passwordProtection: boolean;
  expirationDates: boolean;
}

export interface PlanLimits {
  FREE: PlanFeatures;
  PRO: PlanFeatures;
  ENTERPRISE: PlanFeatures;
}

// API Response Types
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Error Types
export interface ApiError {
  error: string;
  message?: string;
  details?: any;
}

// Form Types
export interface FormError {
  field: string;
  message: string;
}

// Dashboard Specific Types
export interface DashboardMetric {
  label: string;
  value: number | string;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  format?: 'number' | 'percentage' | 'currency' | 'duration';
}

export interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'doughnut' | 'area';
  data: any[];
  options?: any;
}

// Filter and Sort Types
export interface FilterOptions {
  timeRange?: '7d' | '30d' | '90d' | '1y';
  status?: 'active' | 'inactive' | 'all';
  sortBy?: 'createdAt' | 'clicks' | 'title';
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

// Component Prop Types
export interface ComponentWithChildren {
  children: React.ReactNode;
}

export interface ComponentWithClassName {
  className?: string;
}

// Time Period Types
export type TimePeriod = '7d' | '30d' | '90d' | '1y';

// Plan Types
export type Plan = 'FREE' | 'PRO' | 'ENTERPRISE';

// Status Types
export type UrlStatus = 'active' | 'inactive' | 'expired';
export type SubscriptionStatus = 'active' | 'inactive' | 'canceled' | 'past_due' | 'unpaid';