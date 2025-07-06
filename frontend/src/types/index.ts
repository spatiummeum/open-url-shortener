export interface User {
  id: string;
  email: string;
  name: string | null;
  plan: 'FREE' | 'PRO' | 'BUSINESS' | 'ENTERPRISE';
  isActive: boolean;
  isVerified: boolean;
  lastLogin?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  bio?: string;
}

export interface Url {
  id: string;
  originalUrl: string;
  shortCode: string;
  title: string | null;
  description: string | null;
  isActive: boolean;
  expiresAt: Date | null;
  userId: string | null;
  domainId: string | null;
  createdAt: Date;
  updatedAt: Date;
  shortUrl?: string;
  hasPassword?: boolean;
}

export interface Click {
  id: string;
  urlId: string;
  ip: string;
  userAgent: string | null;
  referer: string | null;
  country: string | null;
  city: string | null;
  device: string | null;
  browser: string | null;
  os: string | null;
  timestamp: Date;
}

export interface Analytics {
  id: string;
  urlId: string;
  date: Date;
  clicks: number;
  uniqueClicks: number;
  topCountries: any;
  topReferrers: any;
  topDevices: any;
  topBrowsers: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface Domain {
  id: string;
  domain: string;
  userId: string;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  _count?: {
    urls: number;
  };
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  message: string;
  user: Omit<User, 'password'>;
  tokens: AuthTokens;
}

export interface LoginResponse {
  message: string;
  user: User;
  tokens: AuthTokens;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginationResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Analytics interfaces
export interface AnalyticsSummary {
  totalUrls: number;
  totalClicks: number;
  uniqueClicks: number;
  clicksInPeriod: number;
  avgClicksPerUrl: number;
  clickRate: number;
}

export interface ClicksOverTime {
  date: string;
  clicks: number;
  uniqueClicks: number;
}

export interface TopUrl {
  id: string;
  shortCode: string;
  title: string;
  originalUrl: string;
  clicks: number;
  uniqueClicks: number;
  createdAt: Date | string;
}

export interface GeoData {
  country: string;
  city?: string;
  clicks: number;
  percentage: number;
}

export interface DeviceData {
  device: string;
  clicks: number;
  percentage: number;
}

export interface BrowserData {
  browser: string;
  version?: string;
  clicks: number;
  percentage: number;
}

export interface ReferrerData {
  referrer: string;
  domain: string;
  clicks: number;
  percentage: number;
}

export interface PeriodComparison {
  current: number;
  previous: number;
  change: number;
  changePercentage: number;
}

export interface DashboardAnalytics {
  summary: AnalyticsSummary;
  comparison: {
    clicks: PeriodComparison;
    uniqueClicks: PeriodComparison;
    urls: PeriodComparison;
  };
  charts: {
    clicksOverTime: ClicksOverTime[];
    topUrls: TopUrl[];
    topCountries: GeoData[];
    topCities: GeoData[];
    topReferrers: ReferrerData[];
    topDevices: DeviceData[];
    topBrowsers: BrowserData[];
  };
}

export interface UrlAnalytics {
  url: {
    id: string;
    shortCode: string;
    originalUrl: string;
    title?: string;
    createdAt: Date | string;
  };
  summary: {
    totalClicks: number;
    uniqueClicks: number;
    avgClicksPerDay: number;
    peakDay: { date: string; clicks: number };
    firstClick?: Date | string;
    lastClick?: Date | string;
  };
  charts: {
    clicksOverTime: ClicksOverTime[];
    topCountries: GeoData[];
    topCities: GeoData[];
    topReferrers: ReferrerData[];
    topDevices: DeviceData[];
    topBrowsers: BrowserData[];
    hourlyDistribution: { hour: number; clicks: number }[];
    weeklyDistribution: { day: string; clicks: number }[];
  };
}
