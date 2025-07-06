/**
 * Geolocation service for IP addresses
 * This service provides country and city information based on IP addresses
 */

interface GeoLocation {
  country?: string;
  city?: string;
  region?: string;
  timezone?: string;
  latitude?: number;
  longitude?: number;
}

/**
 * Get geolocation data from IP address
 * In a production environment, you would use a service like:
 * - MaxMind GeoIP2
 * - IPapi
 * - IP2Location
 * - GeoJS
 */
export async function getGeoLocation(ip: string): Promise<GeoLocation> {
  // Skip private/local IPs
  if (isPrivateIP(ip)) {
    return {
      country: 'Unknown',
      city: 'Unknown'
    };
  }

  try {
    // Free tier example with ipapi.co (limited requests)
    // In production, use a paid service or self-hosted solution
    const response = await fetch(`https://ipapi.co/${ip}/json/`, {
      headers: {
        'User-Agent': 'URL-Shortener-Analytics/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json() as any;

    return {
      country: data.country_name || 'Unknown',
      city: data.city || 'Unknown',
      region: data.region || undefined,
      timezone: data.timezone || undefined,
      latitude: data.latitude || undefined,
      longitude: data.longitude || undefined
    };

  } catch (error) {
    console.warn(`Failed to get geolocation for IP ${ip}:`, error);
    
    // Fallback: Try to determine country from IP ranges (basic)
    const fallbackCountry = getFallbackCountry(ip);
    
    return {
      country: fallbackCountry,
      city: 'Unknown'
    };
  }
}

/**
 * Check if IP is private/local
 */
function isPrivateIP(ip: string): boolean {
  const privateRanges = [
    /^127\./,           // 127.0.0.0/8 (localhost)
    /^10\./,            // 10.0.0.0/8 (private)
    /^172\.(1[6-9]|2\d|3[01])\./,  // 172.16.0.0/12 (private)
    /^192\.168\./,      // 192.168.0.0/16 (private)
    /^169\.254\./,      // 169.254.0.0/16 (link-local)
    /^::1$/,            // IPv6 localhost
    /^fc00::/,          // IPv6 private
    /^fe80::/           // IPv6 link-local
  ];

  return privateRanges.some(range => range.test(ip));
}

/**
 * Basic fallback country detection based on IP ranges
 * This is very basic and should be replaced with a proper GeoIP database
 */
function getFallbackCountry(ip: string): string {
  // This is just a placeholder - in reality you'd use a proper GeoIP database
  const ipParts = ip.split('.').map(Number);
  
  if (ipParts.length !== 4 || !ipParts[0]) return 'Unknown';

  const firstOctet = ipParts[0];
  
  // Very basic mapping (not accurate, just for demonstration)
  if (firstOctet >= 1 && firstOctet <= 24) return 'United States';
  if (firstOctet >= 25 && firstOctet <= 49) return 'United Kingdom';
  if (firstOctet >= 50 && firstOctet <= 74) return 'Germany';
  if (firstOctet >= 75 && firstOctet <= 99) return 'France';
  if (firstOctet >= 100 && firstOctet <= 124) return 'Canada';
  if (firstOctet >= 125 && firstOctet <= 149) return 'Japan';
  if (firstOctet >= 150 && firstOctet <= 174) return 'Australia';
  if (firstOctet >= 175 && firstOctet <= 199) return 'Brazil';
  if (firstOctet >= 200 && firstOctet <= 224) return 'China';
  
  return 'Unknown';
}

/**
 * Batch process geolocation for multiple IPs
 * Includes rate limiting to avoid hitting API limits
 */
export async function batchGeoLocation(ips: string[]): Promise<Map<string, GeoLocation>> {
  const results = new Map<string, GeoLocation>();
  const uniqueIps = [...new Set(ips)].filter(ip => !isPrivateIP(ip));
  
  // Process in batches to avoid rate limiting
  const batchSize = 10;
  const delay = 1000; // 1 second between batches
  
  for (let i = 0; i < uniqueIps.length; i += batchSize) {
    const batch = uniqueIps.slice(i, i + batchSize);
    
    const batchPromises = batch.map(async (ip) => {
      const geo = await getGeoLocation(ip);
      results.set(ip, geo);
    });
    
    await Promise.all(batchPromises);
    
    // Add delay between batches if not the last batch
    if (i + batchSize < uniqueIps.length) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return results;
}

/**
 * Get timezone from coordinates
 */
export function getTimezoneFromCoords(latitude: number, longitude: number): string {
  // This would typically use a timezone database or API
  // For now, return a basic estimation
  
  const offset = Math.round(longitude / 15);
  const sign = offset >= 0 ? '+' : '-';
  const hours = Math.abs(offset).toString().padStart(2, '0');
  
  return `UTC${sign}${hours}:00`;
}

/**
 * Calculate distance between two coordinates (in kilometers)
 */
export function calculateDistance(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}
