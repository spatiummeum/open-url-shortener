import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/apiService';
import { DashboardAnalytics } from '../types';

export interface UseDashboardDataReturn {
  data: DashboardAnalytics | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  setTimeRange: (range: string) => void;
  timeRange: string;
}

export const useDashboardData = (initialTimeRange: string = '30d'): UseDashboardDataReturn => {
  const [data, setData] = useState<DashboardAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState(initialTimeRange);

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await apiService.get(`/analytics/dashboard?period=${timeRange}`);
      setData(response);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to load dashboard data';
      setError(errorMessage);
      console.error('Dashboard data fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [timeRange]);

  const refetch = useCallback(() => {
    return fetchDashboardData();
  }, [fetchDashboardData]);

  const handleSetTimeRange = useCallback((range: string) => {
    setTimeRange(range);
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    data,
    isLoading,
    error,
    refetch,
    setTimeRange: handleSetTimeRange,
    timeRange
  };
};

export default useDashboardData;
