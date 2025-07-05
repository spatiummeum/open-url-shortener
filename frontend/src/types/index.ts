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
