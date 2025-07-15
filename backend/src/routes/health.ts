import { Router, Request, Response } from 'express';
import { prisma } from '../utils/database';

const router = Router();

/**
 * Health check endpoint
 * GET /api/health
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    
    // Check database connectivity
    await prisma.$queryRaw`SELECT 1`;
    
    const dbResponseTime = Date.now() - startTime;
    
    // Get basic system info
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        used: process.memoryUsage().heapUsed,
        total: process.memoryUsage().heapTotal,
        external: process.memoryUsage().external,
        rss: process.memoryUsage().rss
      },
      database: {
        status: 'connected',
        responseTime: `${dbResponseTime}ms`
      },
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      node: process.version
    };

    res.status(200).json(healthData);
  } catch (error) {
    console.error('Health check failed:', error);
    
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Database connection failed',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

/**
 * Detailed health check with database tests
 * GET /api/health/detailed
 */
router.get('/detailed', async (req: Request, res: Response) => {
  try {
    const checks = {
      database: { status: 'unknown', responseTime: 0, error: null as string | null },
      memory: { status: 'unknown', usage: 0, available: 0 },
      disk: { status: 'unknown' }
    };

    // Database check
    try {
      const dbStart = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      
      // Test a simple table operation
      await prisma.user.count();
      
      checks.database.responseTime = Date.now() - dbStart;
      checks.database.status = checks.database.responseTime < 1000 ? 'healthy' : 'slow';
    } catch (dbError) {
      checks.database.status = 'unhealthy';
      checks.database.error = (dbError as Error).message;
    }

    // Memory check
    const memUsage = process.memoryUsage();
    const memoryUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    checks.memory.usage = Math.round(memoryUsagePercent);
    checks.memory.available = memUsage.heapTotal - memUsage.heapUsed;
    checks.memory.status = memoryUsagePercent > 90 ? 'critical' : 
                          memoryUsagePercent > 70 ? 'warning' : 'healthy';

    // Overall status
    const overallStatus = Object.values(checks).every(check => check.status === 'healthy') ? 'healthy' :
                         Object.values(checks).some(check => check.status === 'critical' || check.status === 'unhealthy') ? 'unhealthy' : 'warning';

    const response = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      checks,
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        architecture: process.arch,
        pid: process.pid
      }
    };

    const statusCode = overallStatus === 'healthy' ? 200 : 
                      overallStatus === 'warning' ? 200 : 503;

    res.status(statusCode).json(response);
  } catch (error) {
    console.error('Detailed health check failed:', error);
    
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check system failure',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

/**
 * Readiness probe - checks if the service is ready to accept traffic
 * GET /api/health/ready
 */
router.get('/ready', async (req: Request, res: Response) => {
  try {
    // Check critical dependencies
    await prisma.$queryRaw`SELECT 1`;
    
    // Verify essential environment variables
    const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];
    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
    
    if (missingEnvVars.length > 0) {
      return res.status(503).json({
        status: 'not_ready',
        message: 'Missing required environment variables',
        missing: missingEnvVars
      });
    }

    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString(),
      message: 'Service is ready to accept traffic'
    });
  } catch (error) {
    res.status(503).json({
      status: 'not_ready',
      timestamp: new Date().toISOString(),
      error: 'Service dependencies not available',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

/**
 * Liveness probe - checks if the service is alive
 * GET /api/health/live
 */
router.get('/live', (req: Request, res: Response) => {
  // Simple check - if this endpoint responds, the service is alive
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    pid: process.pid
  });
});

export default router;