import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../config/db';

const JWT_SECRET = process.env.JWT_SECRET || 'dakshinamurthy_secret_key_12345';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    status: string;
  };
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication token required.' });
  }

  // Bypass token for admin panel (as requested by user to disable admin authentication)
  if (token === 'admin-bypass-token') {
    req.user = {
      id: 'admin-bypass-id',
      role: 'admin',
      status: 'approved'
    };
    return next();
  }

  jwt.verify(token, JWT_SECRET, async (err: any, decoded: any) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token.' });
    }

    try {
      // Fetch latest user status from DB to prevent deactivated/rejected tokens from working
      const user = await db.getUserById(decoded.id);
      if (!user) {
        return res.status(404).json({ error: 'User account not found.' });
      }

      if (user.status === 'deactivated') {
        return res.status(403).json({ error: 'Your account has been deactivated.' });
      }

      if (user.status === 'rejected') {
        return res.status(403).json({ error: 'Your registration was rejected by the administrator.' });
      }

      if (user.status === 'pending' && user.role !== 'admin') {
        return res.status(403).json({ error: 'Your account registration is pending admin approval.' });
      }

      req.user = {
        id: user.id,
        role: user.role,
        status: user.status
      };
      next();
    } catch (dbErr) {
      return res.status(500).json({ error: 'Internal server verification error.' });
    }
  });
}

export function requireRole(role: 'admin' | 'customer') {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    if (req.user.role !== role) {
      return res.status(403).json({ error: `Forbidden. Requires ${role} access permissions.` });
    }

    next();
  };
}

export const requireAdmin = requireRole('admin');
export const requireCustomer = requireRole('customer');
