import { DashboardAnalytics, UrlAnalytics } from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api';

class AnalyticsService {
  private getAuthHeader(): { Authorization?: string } {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      return token ? { Authorization: `Bearer ${token}` } : {};
    }
    return {};
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }
    
    const data = await response.json();
    return data.data || data;
  }

  async getDashboardAnalytics(period: string = '30d'): Promise<DashboardAnalytics> {
    try {
      const response = await fetch(`${API_BASE_URL}/analytics/dashboard?period=${period}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeader(),
        },
      });

      return await this.handleResponse<DashboardAnalytics>(response);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to fetch dashboard analytics: ${error.message}`);
      }
      throw new Error('Failed to fetch dashboard analytics');
    }
  }

  async getUrlAnalytics(urlId: string, period: string = '7d'): Promise<UrlAnalytics> {
    try {
      const response = await fetch(`${API_BASE_URL}/analytics/${urlId}?period=${period}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeader(),
        },
      });

      return await this.handleResponse<UrlAnalytics>(response);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to fetch URL analytics: ${error.message}`);
      }
      throw new Error('Failed to fetch URL analytics');
    }
  }

  async exportAnalytics(urlId?: string, period: string = '30d'): Promise<Blob> {
    try {
      const endpoint = urlId 
        ? `${API_BASE_URL}/analytics/${urlId}/export?period=${period}`
        : `${API_BASE_URL}/analytics/dashboard/export?period=${period}`;

      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeader(),
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to export analytics: ${errorData.error}`);
      }

      return await response.blob();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to export analytics');
    }
  }
}

export const analyticsService = new AnalyticsService();