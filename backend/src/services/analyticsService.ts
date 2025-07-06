import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
  createdAt: Date;
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
    createdAt: Date;
  };
  summary: {
    totalClicks: number;
    uniqueClicks: number;
    avgClicksPerDay: number;
    peakDay: { date: string; clicks: number };
    firstClick?: Date;
    lastClick?: Date;
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

/**
 * Get date range based on period
 */
function getDateRange(period: string): { startDate: Date; endDate: Date } {
  const endDate = new Date();
  const startDate = new Date();

  switch (period) {
    case '1h':
      startDate.setHours(endDate.getHours() - 1);
      break;
    case '24h':
      startDate.setDate(endDate.getDate() - 1);
      break;
    case '7d':
      startDate.setDate(endDate.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(endDate.getDate() - 30);
      break;
    case '90d':
      startDate.setDate(endDate.getDate() - 90);
      break;
    case '6m':
      startDate.setMonth(endDate.getMonth() - 6);
      break;
    case '1y':
      startDate.setFullYear(endDate.getFullYear() - 1);
      break;
    default:
      startDate.setDate(endDate.getDate() - 30);
  }

  return { startDate, endDate };
}

/**
 * Parse user agent to extract browser and device info
 */
function parseUserAgent(userAgent: string): { browser: string; device: string; os: string } {
  const ua = userAgent.toLowerCase();
  
  let browser = 'Unknown';
  let device = 'Unknown';
  let os = 'Unknown';

  // Browser detection
  if (ua.includes('edg/')) browser = 'Edge';
  else if (ua.includes('chrome/') && !ua.includes('edg/')) browser = 'Chrome';
  else if (ua.includes('firefox/')) browser = 'Firefox';
  else if (ua.includes('safari/') && !ua.includes('chrome/')) browser = 'Safari';
  else if (ua.includes('opera/') || ua.includes('opr/')) browser = 'Opera';

  // Device detection
  if (ua.includes('mobile')) device = 'Mobile';
  else if (ua.includes('tablet') || ua.includes('ipad')) device = 'Tablet';
  else device = 'Desktop';

  // OS detection
  if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('mac')) os = 'macOS';
  else if (ua.includes('linux')) os = 'Linux';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';

  return { browser, device, os };
}

/**
 * Extract domain from referrer URL
 */
function extractDomain(url: string): string {
  if (!url || url === 'Direct') return 'Direct';
  try {
    const domain = new URL(url).hostname;
    return domain.replace('www.', '');
  } catch {
    return 'Unknown';
  }
}

/**
 * Get dashboard analytics for a user
 */
export async function getDashboardAnalytics(
  userId: string,
  period: string = '30d'
): Promise<DashboardAnalytics> {
  const { startDate, endDate } = getDateRange(period);
  const { startDate: prevStartDate, endDate: prevEndDate } = getDateRange(
    period === '7d' ? '7d' : period === '30d' ? '30d' : '90d'
  );
  
  // Adjust previous period dates
  const periodDuration = endDate.getTime() - startDate.getTime();
  prevEndDate.setTime(startDate.getTime());
  prevStartDate.setTime(startDate.getTime() - periodDuration);

  // Get user's URLs
  const userUrls = await prisma.url.findMany({
    where: { userId },
    select: { 
      id: true, 
      shortCode: true, 
      title: true, 
      originalUrl: true,
      createdAt: true,
      _count: { select: { clicks: true } }
    }
  });

  if (userUrls.length === 0) {
    return {
      summary: {
        totalUrls: 0,
        totalClicks: 0,
        uniqueClicks: 0,
        clicksInPeriod: 0,
        avgClicksPerUrl: 0,
        clickRate: 0
      },
      comparison: {
        clicks: { current: 0, previous: 0, change: 0, changePercentage: 0 },
        uniqueClicks: { current: 0, previous: 0, change: 0, changePercentage: 0 },
        urls: { current: 0, previous: 0, change: 0, changePercentage: 0 }
      },
      charts: {
        clicksOverTime: [],
        topUrls: [],
        topCountries: [],
        topCities: [],
        topReferrers: [],
        topDevices: [],
        topBrowsers: []
      }
    };
  }

  const urlIds = userUrls.map(url => url.id);

  // Get summary statistics
  const [
    totalClicks,
    currentPeriodClicks,
    previousPeriodClicks,
    currentPeriodData,
    previousPeriodData
  ] = await Promise.all([
    // Total clicks ever
    prisma.click.count({ where: { urlId: { in: urlIds } } }),
    
    // Current period clicks
    prisma.click.findMany({
      where: {
        urlId: { in: urlIds },
        timestamp: { gte: startDate, lte: endDate }
      },
      select: { ip: true, timestamp: true, urlId: true }
    }),
    
    // Previous period clicks
    prisma.click.findMany({
      where: {
        urlId: { in: urlIds },
        timestamp: { gte: prevStartDate, lte: prevEndDate }
      },
      select: { ip: true }
    }),
    
    // Current period detailed data
    prisma.click.findMany({
      where: {
        urlId: { in: urlIds },
        timestamp: { gte: startDate, lte: endDate }
      },
      select: {
        id: true,
        ip: true,
        timestamp: true,
        urlId: true,
        userAgent: true,
        referer: true,
        country: true,
        city: true,
        device: true,
        browser: true,
        os: true
      }
    }),
    
    // Previous period for comparison
    prisma.click.findMany({
      where: {
        urlId: { in: urlIds },
        timestamp: { gte: prevStartDate, lte: prevEndDate }
      },
      select: { ip: true }
    })
  ]);

  // Calculate metrics
  const currentClicks = currentPeriodClicks.length;
  const currentUniqueClicks = new Set(currentPeriodClicks.map(c => c.ip)).size;
  const previousClicks = previousPeriodClicks.length;
  const previousUniqueClicks = new Set(previousPeriodClicks.map(c => c.ip)).size;

  const clicksChange = currentClicks - previousClicks;
  const clicksChangePercent = previousClicks > 0 ? (clicksChange / previousClicks) * 100 : 0;
  
  const uniqueClicksChange = currentUniqueClicks - previousUniqueClicks;
  const uniqueClicksChangePercent = previousUniqueClicks > 0 ? (uniqueClicksChange / previousUniqueClicks) * 100 : 0;

  // URLs created in periods
  const currentUrls = userUrls.filter(url => url.createdAt >= startDate && url.createdAt <= endDate).length;
  const previousUrls = userUrls.filter(url => url.createdAt >= prevStartDate && url.createdAt <= prevEndDate).length;
  const urlsChange = currentUrls - previousUrls;
  const urlsChangePercent = previousUrls > 0 ? (urlsChange / previousUrls) * 100 : 0;

  // Generate clicks over time
  const clicksByDate: Record<string, { clicks: number; uniqueIps: Set<string> }> = {};
  
  currentPeriodData.forEach(click => {
    const date = click.timestamp.toISOString().split('T')[0];
    if (date) {
      if (!clicksByDate[date]) {
        clicksByDate[date] = { clicks: 0, uniqueIps: new Set() };
      }
      clicksByDate[date].clicks++;
      clicksByDate[date].uniqueIps.add(click.ip);
    }
  });

  const clicksOverTime: ClicksOverTime[] = Object.entries(clicksByDate)
    .map(([date, data]) => ({
      date,
      clicks: data.clicks,
      uniqueClicks: data.uniqueIps.size
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Top URLs with detailed metrics
  const urlClickCounts: Record<string, { clicks: number; uniqueIps: Set<string> }> = {};
  
  currentPeriodData.forEach(click => {
    if (!urlClickCounts[click.urlId]) {
      urlClickCounts[click.urlId] = { clicks: 0, uniqueIps: new Set() };
    }
    urlClickCounts[click.urlId]!.clicks++;
    urlClickCounts[click.urlId]!.uniqueIps.add(click.ip);
  });

  const topUrls: TopUrl[] = userUrls
    .map(url => ({
      id: url.id,
      shortCode: url.shortCode,
      title: url.title || url.originalUrl,
      originalUrl: url.originalUrl,
      clicks: urlClickCounts[url.id]?.clicks || 0,
      uniqueClicks: urlClickCounts[url.id]?.uniqueIps.size || 0,
      createdAt: url.createdAt
    }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 10);

  // Geographic data
  const countryStats: Record<string, number> = {};
  const cityStats: Record<string, number> = {};
  
  currentPeriodData.forEach(click => {
    if (click.country) {
      countryStats[click.country] = (countryStats[click.country] || 0) + 1;
    }
    if (click.city && click.country) {
      const cityKey = `${click.city}, ${click.country}`;
      cityStats[cityKey] = (cityStats[cityKey] || 0) + 1;
    }
  });

  const topCountries: GeoData[] = Object.entries(countryStats)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([country, clicks]) => ({
      country,
      clicks,
      percentage: (clicks / currentClicks) * 100
    }));

  const topCities: GeoData[] = Object.entries(cityStats)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([city, clicks]) => ({
      country: city.split(', ')[1] || '',
      city: city.split(', ')[0],
      clicks,
      percentage: (clicks / currentClicks) * 100
    }));

  // Referrer data
  const referrerStats: Record<string, number> = {};
  
  currentPeriodData.forEach(click => {
    const referrer = click.referer || 'Direct';
    const domain = extractDomain(referrer);
    referrerStats[domain] = (referrerStats[domain] || 0) + 1;
  });

  const topReferrers: ReferrerData[] = Object.entries(referrerStats)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([domain, clicks]) => ({
      referrer: domain === 'Direct' ? 'Direct' : domain,
      domain,
      clicks,
      percentage: (clicks / currentClicks) * 100
    }));

  // Device and browser data
  const deviceStats: Record<string, number> = {};
  const browserStats: Record<string, number> = {};
  
  currentPeriodData.forEach(click => {
    if (click.userAgent) {
      const { browser, device } = parseUserAgent(click.userAgent);
      deviceStats[device] = (deviceStats[device] || 0) + 1;
      browserStats[browser] = (browserStats[browser] || 0) + 1;
    }
  });

  const topDevices: DeviceData[] = Object.entries(deviceStats)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([device, clicks]) => ({
      device,
      clicks,
      percentage: (clicks / currentClicks) * 100
    }));

  const topBrowsers: BrowserData[] = Object.entries(browserStats)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([browser, clicks]) => ({
      browser,
      clicks,
      percentage: (clicks / currentClicks) * 100
    }));

  return {
    summary: {
      totalUrls: userUrls.length,
      totalClicks,
      uniqueClicks: currentUniqueClicks,
      clicksInPeriod: currentClicks,
      avgClicksPerUrl: userUrls.length > 0 ? totalClicks / userUrls.length : 0,
      clickRate: currentUniqueClicks > 0 ? (currentClicks / currentUniqueClicks) : 0
    },
    comparison: {
      clicks: {
        current: currentClicks,
        previous: previousClicks,
        change: clicksChange,
        changePercentage: clicksChangePercent
      },
      uniqueClicks: {
        current: currentUniqueClicks,
        previous: previousUniqueClicks,
        change: uniqueClicksChange,
        changePercentage: uniqueClicksChangePercent
      },
      urls: {
        current: currentUrls,
        previous: previousUrls,
        change: urlsChange,
        changePercentage: urlsChangePercent
      }
    },
    charts: {
      clicksOverTime,
      topUrls,
      topCountries,
      topCities,
      topReferrers,
      topDevices,
      topBrowsers
    }
  };
}

/**
 * Get detailed analytics for a specific URL
 */
export async function getUrlAnalytics(
  urlId: string,
  userId: string,
  period: string = '30d'
): Promise<UrlAnalytics | null> {
  const { startDate, endDate } = getDateRange(period);

  // Verify URL belongs to user
  const url = await prisma.url.findFirst({
    where: { id: urlId, userId },
    select: { 
      id: true, 
      shortCode: true, 
      originalUrl: true, 
      title: true,
      createdAt: true
    }
  });

  if (!url) return null;

  // Get all clicks for this URL in the period
  const clicks = await prisma.click.findMany({
    where: {
      urlId,
      timestamp: { gte: startDate, lte: endDate }
    },
    select: {
      id: true,
      ip: true,
      timestamp: true,
      userAgent: true,
      referer: true,
      country: true,
      city: true,
      device: true,
      browser: true,
      os: true
    },
    orderBy: { timestamp: 'asc' }
  });

  const totalClicks = clicks.length;
  const uniqueClicks = new Set(clicks.map(c => c.ip)).size;
  
  const firstClick = clicks.length > 0 ? clicks[0]!.timestamp : undefined;
  const lastClick = clicks.length > 0 ? clicks[clicks.length - 1]!.timestamp : undefined;
  
  const periodDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const avgClicksPerDay = periodDays > 0 ? totalClicks / periodDays : 0;

  // Find peak day
  const clicksByDate: Record<string, number> = {};
  clicks.forEach(click => {
    const date = click.timestamp.toISOString().split('T')[0];
    if (date) {
      clicksByDate[date] = (clicksByDate[date] || 0) + 1;
    }
  });

  const peakDay = Object.entries(clicksByDate)
    .sort(([,a], [,b]) => b - a)[0] || ['', 0];

  // Generate detailed charts
  const clicksOverTime: ClicksOverTime[] = Object.entries(clicksByDate)
    .map(([date, clicksCount]) => {
      const dayClicks = clicks.filter((c: any) => c.timestamp.toISOString().split('T')[0] === date);
      const uniqueIps = new Set(dayClicks.map((c: any) => c.ip)).size;
      return {
        date,
        clicks: clicksCount,
        uniqueClicks: uniqueIps
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  // Hourly distribution
  const hourlyStats: Record<number, number> = {};
  clicks.forEach(click => {
    const hour = click.timestamp.getHours();
    hourlyStats[hour] = (hourlyStats[hour] || 0) + 1;
  });

  const hourlyDistribution = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    clicks: hourlyStats[hour] || 0
  }));

  // Weekly distribution
  const weeklyStats: Record<string, number> = {};
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  clicks.forEach(click => {
    const dayName = dayNames[click.timestamp.getDay()];
    if (dayName) {
      weeklyStats[dayName] = (weeklyStats[dayName] || 0) + 1;
    }
  });

  const weeklyDistribution = dayNames.map(day => ({
    day,
    clicks: weeklyStats[day] || 0
  }));

  // Reuse the same logic for geo, referrer, device, and browser data
  const countryStats: Record<string, number> = {};
  const cityStats: Record<string, number> = {};
  const referrerStats: Record<string, number> = {};
  const deviceStats: Record<string, number> = {};
  const browserStats: Record<string, number> = {};

  clicks.forEach(click => {
    if (click.country) {
      countryStats[click.country] = (countryStats[click.country] || 0) + 1;
    }
    if (click.city && click.country) {
      const cityKey = `${click.city}, ${click.country}`;
      cityStats[cityKey] = (cityStats[cityKey] || 0) + 1;
    }
    
    const referrer = click.referer || 'Direct';
    const domain = extractDomain(referrer);
    referrerStats[domain] = (referrerStats[domain] || 0) + 1;

    if (click.userAgent) {
      const { browser, device } = parseUserAgent(click.userAgent);
      deviceStats[device] = (deviceStats[device] || 0) + 1;
      browserStats[browser] = (browserStats[browser] || 0) + 1;
    }
  });

  const topCountries: GeoData[] = Object.entries(countryStats)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([country, clicks]) => ({
      country,
      clicks,
      percentage: (clicks / totalClicks) * 100
    }));

  const topCities: GeoData[] = Object.entries(cityStats)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([city, clicks]) => ({
      country: city.split(', ')[1] || '',
      city: city.split(', ')[0],
      clicks,
      percentage: (clicks / totalClicks) * 100
    }));

  const topReferrers: ReferrerData[] = Object.entries(referrerStats)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([domain, clicks]) => ({
      referrer: domain === 'Direct' ? 'Direct' : domain,
      domain,
      clicks,
      percentage: (clicks / totalClicks) * 100
    }));

  const topDevices: DeviceData[] = Object.entries(deviceStats)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([device, clicks]) => ({
      device,
      clicks,
      percentage: (clicks / totalClicks) * 100
    }));

  const topBrowsers: BrowserData[] = Object.entries(browserStats)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([browser, clicks]) => ({
      browser,
      clicks,
      percentage: (clicks / totalClicks) * 100
    }));

  return {
    url: {
      ...url,
      title: url.title || undefined
    },
    summary: {
      totalClicks,
      uniqueClicks,
      avgClicksPerDay,
      peakDay: { date: peakDay[0], clicks: peakDay[1] as number },
      firstClick,
      lastClick
    },
    charts: {
      clicksOverTime,
      topCountries,
      topCities,
      topReferrers,
      topDevices,
      topBrowsers,
      hourlyDistribution,
      weeklyDistribution
    }
  };
}

/**
 * Create analytics aggregation for a specific date
 * This should be run daily via cron job
 */
export async function createDailyAnalytics(date: Date = new Date()): Promise<void> {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  // Get all URLs that had clicks on this date
  const urlsWithClicks = await prisma.click.groupBy({
    by: ['urlId'],
    where: {
      timestamp: {
        gte: startOfDay,
        lte: endOfDay
      }
    }
  });

  for (const { urlId } of urlsWithClicks) {
    // Get all clicks for this URL on this date
    const clicks = await prisma.click.findMany({
      where: {
        urlId,
        timestamp: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      select: {
        ip: true,
        userAgent: true,
        referer: true,
        country: true,
        city: true,
        device: true,
        browser: true,
        os: true
      }
    });

    const totalClicks = clicks.length;
    const uniqueClicks = new Set(clicks.map(c => c.ip)).size;

    // Aggregate data
    const countries: Record<string, number> = {};
    const referrers: Record<string, number> = {};
    const devices: Record<string, number> = {};
    const browsers: Record<string, number> = {};

    clicks.forEach(click => {
      if (click.country) {
        countries[click.country] = (countries[click.country] || 0) + 1;
      }
      
      const referrer = extractDomain(click.referer || 'Direct');
      referrers[referrer] = (referrers[referrer] || 0) + 1;

      if (click.userAgent) {
        const { browser, device } = parseUserAgent(click.userAgent);
        devices[device] = (devices[device] || 0) + 1;
        browsers[browser] = (browsers[browser] || 0) + 1;
      }
    });

    // Store aggregated data
    await prisma.analytics.upsert({
      where: {
        urlId_date: {
          urlId,
          date: startOfDay
        }
      },
      create: {
        urlId,
        date: startOfDay,
        clicks: totalClicks,
        uniqueClicks,
        topCountries: countries,
        topReferrers: referrers,
        topDevices: devices,
        topBrowsers: browsers
      },
      update: {
        clicks: totalClicks,
        uniqueClicks,
        topCountries: countries,
        topReferrers: referrers,
        topDevices: devices,
        topBrowsers: browsers
      }
    });
  }
}
