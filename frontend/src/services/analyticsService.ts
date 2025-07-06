import { DashboardAnalytics, UrlAnalytics, ApiResponse } from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

class AnalyticsService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('accessToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async getDashboardAnalytics(period: string = '30d'): Promise<DashboardAnalytics> {
    const response = await fetch(
      `${API_BASE_URL}/analytics/dashboard?period=${period}`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch dashboard analytics: ${response.statusText}`);
    }

    const data: ApiResponse<DashboardAnalytics> = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch dashboard analytics');
    }

    return data.data!;
  }

  async getUrlAnalytics(urlId: string, period: string = '30d'): Promise<UrlAnalytics> {
    const response = await fetch(
      `${API_BASE_URL}/analytics/${urlId}?period=${period}`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch URL analytics: ${response.statusText}`);
    }

    const data: ApiResponse<UrlAnalytics> = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch URL analytics');
    }

    return data.data!;
  }

  async exportAnalytics(urlId?: string, period: string = '30d'): Promise<Blob> {
    const endpoint = urlId 
      ? `${API_BASE_URL}/analytics/${urlId}/export?period=${period}`
      : `${API_BASE_URL}/analytics/dashboard/export?period=${period}`;

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to export analytics: ${response.statusText}`);
    }

    return response.blob();
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;
