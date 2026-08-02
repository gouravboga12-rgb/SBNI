import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'sbni_jwt_access_super_secret_key_2026';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'sbni_jwt_refresh_super_secret_key_2026';

export interface TokenPayload {
  userId: string;
  email: string;
  role: Role;
}

export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, JWT_ACCESS_SECRET, { expiresIn: '1d' });
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' });
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, JWT_ACCESS_SECRET) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, JWT_REFRESH_SECRET) as TokenPayload;
};
