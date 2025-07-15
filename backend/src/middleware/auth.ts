import { Request, Response, NextFunction } from 'express';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string | null;
    plan: string;
  };
}

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  // Mock implementation for testing
  req.user = {
    id: 'user_123',
    email: 'test@example.com',
    name: 'Test User',
    plan: 'FREE',
  };
  next();
};

export const optionalAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  // Mock implementation for testing
  next();
};
