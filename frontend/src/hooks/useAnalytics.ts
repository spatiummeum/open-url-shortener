import { useState, useEffect, useCallback } from 'react';
import { DashboardAnalytics, UrlAnalytics } from '../types';
import analyticsService from '../services/analyticsService';

export function useAnalytics(period: string = '30d') {
  const [data, setData] = useState<DashboardAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const analyticsData = await analyticsService.getDashboardAnalytics(period);
      setData(analyticsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const refresh = useCallback(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    data,
    loading,
    error,
    refresh,
  };
}

export function useUrlAnalytics(urlId: string, period: string = '30d') {
  const [data, setData] = useState<UrlAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUrlAnalytics = useCallback(async () => {
    if (!urlId) return;
    
    try {
      setLoading(true);
      setError(null);
      const analyticsData = await analyticsService.getUrlAnalytics(urlId, period);
      setData(analyticsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch URL analytics');
    } finally {
      setLoading(false);
    }
  }, [urlId, period]);

  useEffect(() => {
    fetchUrlAnalytics();
  }, [fetchUrlAnalytics]);

  const refresh = useCallback(() => {
    fetchUrlAnalytics();
  }, [fetchUrlAnalytics]);

  return {
    data,
    loading,
    error,
    refresh,
  };
}

export function useAnalyticsExport() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportAnalytics = useCallback(async (
    urlId?: string, 
    period: string = '30d'
  ) => {
    try {
      setLoading(true);
      setError(null);
      
      const blob = await analyticsService.exportAnalytics(urlId, period);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `analytics-${urlId || 'dashboard'}-${period}-${new Date().toISOString().split('T')[0]}.csv`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Cleanup
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    exportAnalytics,
    loading,
    error,
  };
}
