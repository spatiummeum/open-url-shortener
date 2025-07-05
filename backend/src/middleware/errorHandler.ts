import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Si los headers ya fueron enviados, delegar al error handler por defecto de Express
  if (res.headersSent) {
    return next(err);
  }

  // Error de validación
  if (err.name === 'ValidationError') {
    res.status(400).json({
      error: 'Validation Error',
      details: err.details || err.message,
    });
    return;
  }

  // Error de autenticación
  if (err.name === 'UnauthorizedError' || err.message === 'jwt malformed') {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or missing authentication token',
    });
    return;
  }

  // Error de base de datos
  if (err.code === 'P2002') {
    res.status(409).json({
      error: 'Conflict',
      message: 'Resource already exists',
    });
    return;
  }

  // Error genérico del servidor
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' 
      ? 'Something went wrong' 
      : err.message,
  });
};
