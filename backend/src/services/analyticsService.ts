import { prisma } from '../utils/database';

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

export interface DashboardAnalytics {
  summary: AnalyticsSummary;
  comparison?: {
    clicks?: { current: number; previous: number; change: number; changePercentage: number };
    uniqueClicks?: { current: number; previous: number; change: number; changePercentage: number };
    urls?: { current: number; previous: number; change: number; changePercentage: number };
  };
  charts: {
    clicksOverTime: Array<{ date: string; clicks: number; uniqueClicks: number }>;
    topUrls: Array<{ id: string; shortCode: string; title: string; originalUrl: string; clicks: number; uniqueClicks: number; createdAt: string }>;
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

// Helper functions
function getStartDate(period: string, from: Date): Date {
  const date = new Date(from);
  
  switch (period) {
    case '7d':
      date.setDate(date.getDate() - 7);
      break;
    case '30d':
      date.setDate(date.getDate() - 30);
      break;
    case '90d':
      date.setDate(date.getDate() - 90);
      break;
    case '1y':
      date.setFullYear(date.getFullYear() - 1);
      break;
    default:
      date.setDate(date.getDate() - 30);
  }
  
  return date;
}

function buildTopChart(clicks: any[], field: string, limit: number): any[] {
  const counts = clicks.reduce((acc, click) => {
    const value = click[field];
    if (value) {
      acc[value] = (acc[value] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const total = clicks.length;
  
  return Object.entries(counts)
    .map(([key, count]) => ({
      [field]: key,
      clicks: count as number,
      percentage: total > 0 ? ((count as number) / total) * 100 : 0
    }))
    .sort((a: any, b: any) => (b.clicks as number) - (a.clicks as number))
    .slice(0, limit);
}

function groupClicksByPeriod(clicks: any[], period: string) {
  const grouped = clicks.reduce((acc: Record<string, { clicks: number; uniqueClicks: Set<string> }>, click: any) => {
    let key: string;
    const date = new Date(click.createdAt);
    
    if (period === '7d' || period === '30d') {
      key = date.toISOString().split('T')[0]; // Daily
    } else {
      // Weekly or monthly grouping for longer periods
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      key = weekStart.toISOString().split('T')[0];
    }
    
    if (!acc[key]) {
      acc[key] = { clicks: 0, uniqueClicks: new Set() };
    }
    
    acc[key].clicks++;
    acc[key].uniqueClicks.add(click.ip);
    
    return acc;
  }, {} as Record<string, { clicks: number; uniqueClicks: Set<string> }>);

  return Object.entries(grouped)
    .map(([date, data]) => ({
      date,
      clicks: data.clicks,
      uniqueClicks: data.uniqueClicks.size
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export const getDashboardAnalytics = async (userId: string, period: string = '30d'): Promise<DashboardAnalytics> => {
  const now = new Date();
  const startDate = getStartDate(period, now);
  const previousStartDate = getStartDate(period, startDate);
  
  // Get user's URLs
  const userUrls = await prisma.url.findMany({
    where: { userId },
    select: {
      id: true,
      shortCode: true,
      title: true,
      originalUrl: true,
      createdAt: true,
      _count: {
        select: {
          clicks: true
        }
      }
    }
  });

  // Calculate current period metrics
  const currentClicks = await prisma.click.findMany({
    where: {
      url: { userId },
      createdAt: {
        gte: startDate
      }
    },
    include: {
      url: true
    }
  });

  // Calculate previous period metrics for comparison
  const previousClicks = await prisma.click.findMany({
    where: {
      url: { userId },
      createdAt: {
        gte: previousStartDate,
        lt: startDate
      }
    }
  });

  // Build summary metrics
  const totalUrls = userUrls.length;
  const totalClicks = userUrls.reduce((sum: number, url: any) => sum + url._count.clicks, 0);
  const currentPeriodClicks = currentClicks.length;
  const previousPeriodClicks = previousClicks.length;
  
  // Calculate unique clicks (unique by IP)
  const uniqueCurrentClicks = new Set(currentClicks.map((click: any) => click.ip)).size;
  const uniquePreviousClicks = new Set(previousClicks.map((click: any) => click.ip)).size;
  
  const avgClicksPerUrl = totalUrls > 0 ? totalClicks / totalUrls : 0;
  const clickRate = totalUrls > 0 ? (totalClicks / totalUrls) * 100 : 0;

  // Build charts data
  const clicksOverTime = groupClicksByPeriod(currentClicks, period);
  
  const topUrls = userUrls
    .map((url: any) => ({
      id: url.id,
      shortCode: url.shortCode,
      title: url.title || url.originalUrl,
      originalUrl: url.originalUrl,
      clicks: url._count.clicks,
      uniqueClicks: 0, // Would need separate query for unique clicks per URL
      createdAt: url.createdAt.toISOString()
    }))
    .sort((a: any, b: any) => b.clicks - a.clicks)
    .slice(0, 10);

  const topCountries = buildTopChart(currentClicks.filter((c: any) => c.country), 'country', 10) as Array<{ country: string; clicks: number; percentage: number }>;
  const topDevices = buildTopChart(currentClicks.filter((c: any) => c.device), 'device', 10) as Array<{ device: string; clicks: number; percentage: number }>;
  const topBrowsers = buildTopChart(currentClicks.filter((c: any) => c.browser), 'browser', 10) as Array<{ browser: string; clicks: number; percentage: number }>;

  // Build comparison data
  const comparison = {
    clicks: {
      current: currentPeriodClicks,
      previous: previousPeriodClicks,
      change: currentPeriodClicks - previousPeriodClicks,
      changePercentage: previousPeriodClicks > 0 
        ? ((currentPeriodClicks - previousPeriodClicks) / previousPeriodClicks) * 100 
        : 0
    },
    uniqueClicks: {
      current: uniqueCurrentClicks,
      previous: uniquePreviousClicks,
      change: uniqueCurrentClicks - uniquePreviousClicks,
      changePercentage: uniquePreviousClicks > 0 
        ? ((uniqueCurrentClicks - uniquePreviousClicks) / uniquePreviousClicks) * 100 
        : 0
    },
    urls: {
      current: totalUrls,
      previous: totalUrls, // URLs don't change much in short periods
      change: 0,
      changePercentage: 0
    }
  };

  return {
    summary: {
      totalUrls,
      totalClicks,
      uniqueClicks: uniqueCurrentClicks,
      clicksInPeriod: currentPeriodClicks,
      avgClicksPerUrl,
      clickRate
    },
    comparison,
    charts: {
      clicksOverTime,
      topUrls,
      topCountries,
      topCities: [], // Simplified for now
      topReferrers: [], // Simplified for now
      topDevices,
      topBrowsers
    }
  };
};

export const getUrlAnalytics = async (urlId: string, userId: string, period: string = '30d'): Promise<UrlAnalytics | null> => {
  // Verify URL belongs to user
  const url = await prisma.url.findFirst({
    where: {
      id: urlId,
      userId
    },
    select: {
      id: true,
      shortCode: true,
      originalUrl: true,
      title: true,
      createdAt: true
    }
  });

  if (!url) {
    return null;
  }

  const startDate = getStartDate(period, new Date());

  // Get clicks for this URL
  const clicks = await prisma.click.findMany({
    where: {
      urlId,
      createdAt: {
        gte: startDate
      }
    },
    orderBy: {
      createdAt: 'asc'
    }
  });

  // Calculate summary metrics
  const totalClicks = clicks.length;
  const uniqueClicks = new Set(clicks.map((click: any) => click.ip)).size;
  const daysDiff = Math.ceil((new Date().getTime() - startDate.getTime()) / (1000 * 3600 * 24));
  const avgClicksPerDay = daysDiff > 0 ? totalClicks / daysDiff : 0;

  // Find peak day
  const clicksByDay = clicks.reduce((acc: Record<string, number>, click: any) => {
    const date = click.createdAt.toISOString().split('T')[0];
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  let peakDay = { date: '', clicks: 0 };
  for (const [date, count] of Object.entries(clicksByDay)) {
    const numCount = count as number;
    if (numCount > peakDay.clicks) {
      peakDay = { date, clicks: numCount };
    }
  }

  const firstClick = clicks.length > 0 ? clicks[0].createdAt.toISOString() : '';
  const lastClick = clicks.length > 0 ? clicks[clicks.length - 1].createdAt.toISOString() : '';

  // Build charts
  const clicksOverTime = groupClicksByPeriod(clicks, period);
  const topCountries = buildTopChart(clicks.filter((c: any) => c.country), 'country', 10) as Array<{ country: string; clicks: number; percentage: number }>;
  const topDevices = buildTopChart(clicks.filter((c: any) => c.device), 'device', 10) as Array<{ device: string; clicks: number; percentage: number }>;
  const topBrowsers = buildTopChart(clicks.filter((c: any) => c.browser), 'browser', 10) as Array<{ browser: string; clicks: number; percentage: number }>;

  // Hourly distribution
  const hourlyDistribution = Array(24).fill(0).map((_, hour) => ({
    hour,
    clicks: clicks.filter((click: any) => new Date(click.createdAt).getHours() === hour).length
  }));

  // Weekly distribution
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const weeklyDistribution = Array(7).fill(0).map((_, index) => ({
    day: dayNames[index],
    clicks: clicks.filter((click: any) => new Date(click.createdAt).getDay() === index).length
  }));

  return {
    url: {
      id: url.id,
      shortCode: url.shortCode,
      originalUrl: url.originalUrl,
      title: url.title || '',
      createdAt: url.createdAt.toISOString()
    },
    summary: {
      totalClicks,
      uniqueClicks,
      avgClicksPerDay,
      peakDay,
      firstClick,
      lastClick
    },
    charts: {
      clicksOverTime,
      topCountries,
      topCities: [], // Simplified
      topReferrers: [], // Simplified
      topDevices,
      topBrowsers,
      hourlyDistribution,
      weeklyDistribution
    }
  };
};

export const createDailyAnalytics = async (date?: Date) => {
  const targetDate = date || new Date();
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  // Get clicks for the day and group by URL
  const clicksByUrl = await prisma.click.groupBy({
    by: ['urlId'],
    where: {
      createdAt: {
        gte: startOfDay,
        lte: endOfDay
      }
    },
    _count: {
      id: true
    }
  });

  // This is a placeholder for daily analytics aggregation
  // In a real implementation, you might want to store daily summaries
  console.log(`Daily analytics for ${targetDate.toISOString().split('T')[0]}:`, clicksByUrl);
};