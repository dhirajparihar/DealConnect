import jwt from 'jsonwebtoken';
import { DealerRole } from '@dealconnect/shared-types';
import { ApiError } from '../../common/api-error.js';

export interface UserJwtPayload {
  sub: string; // userId
  dealerId: string;
  role: DealerRole;
  type: 'user';
  isPlatformAdmin?: boolean;
}

export interface CustomerJwtPayload {
  sub: string; // customerId
  dealerId: string;
  phone: string;
  type: 'customer';
}

export type AuthJwtPayload = UserJwtPayload | CustomerJwtPayload;

export class JwtService {
  private secret: string;

  constructor() {
    this.secret = process.env.SESSION_SECRET || 'super-secret-session-key-must-be-at-least-32-chars';
  }

  generateUserToken(userId: string, dealerId: string, role: DealerRole, isPlatformAdmin = false): string {
    const payload: UserJwtPayload = {
      sub: userId,
      dealerId,
      role,
      type: 'user',
      isPlatformAdmin,
    };
    return jwt.sign(payload, this.secret, { expiresIn: '7d' });
  }

  generateCustomerToken(customerId: string, dealerId: string, phone: string): string {
    const payload: CustomerJwtPayload = {
      sub: customerId,
      dealerId,
      phone,
      type: 'customer',
    };
    return jwt.sign(payload, this.secret, { expiresIn: '30d' });
  }

  verifyToken(token: string): AuthJwtPayload {
    try {
      return jwt.verify(token, this.secret) as AuthJwtPayload;
    } catch (err) {
      throw new ApiError(401, 'UNAUTHORIZED', 'Invalid or expired authentication token.');
    }
  }
}
