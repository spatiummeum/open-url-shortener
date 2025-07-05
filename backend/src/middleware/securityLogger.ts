import { Request, Response, NextFunction } from 'express';
import { PrismaClient, SecurityEventType } from '@prisma/client';
import logger from '../utils/logger';

const prisma = new PrismaClient();

export const securityLogger = async (req: Request, res: Response, next: NextFunction) => {
  const suspiciousPatterns = [
    /sql|union|select|drop|delete|insert|update/i,
    /<script|javascript:|onload|onerror/i,
    /\.\.|\/etc\/passwd|\/windows\/system32/i,
  ];

  const userAgent = req.get('User-Agent') || '';
  const ip = req.ip || '';

  // Detectar patrones sospechosos en la URL
  const isSuspicious = suspiciousPatterns.some(pattern => 
    pattern.test(req.url) || pattern.test(userAgent)
  );

  if (isSuspicious) {
    logger.warn('Suspicious activity detected', {
      ip,
      userAgent,
      url: req.url,
      method: req.method,
    });

    // Registrar evento de seguridad
    try {
      await prisma.securityEvent.create({
        data: {
          type: SecurityEventType.SUSPICIOUS_ACTIVITY,
          description: 'Suspicious patterns detected in request',
          ip,
          userAgent,
          metadata: {
            url: req.url,
            method: req.method,
          },
        },
      });
    } catch (error) {
      logger.error('Error logging security event:', error);
    }
  }

  next();
};
