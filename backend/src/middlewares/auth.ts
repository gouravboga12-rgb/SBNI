import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { verifyAccessToken, TokenPayload } from '../utils/jwt';

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

export const authenticateUser = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized access. Token required.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired access token.' });
  }
};

export const authorizeRoles = (...roles: Role[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You do not have permission to perform this action.',
      });
    }
    next();
  };
};
