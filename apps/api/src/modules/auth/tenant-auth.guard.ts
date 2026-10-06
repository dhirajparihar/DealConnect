import { Request, Response, NextFunction } from 'express';
import { JwtService, AuthJwtPayload } from './jwt.service.js';
import { runWithTenantContext, getTenantContext } from '../../common/tenant-context.js';
import { ApiError } from '../../common/api-error.js';
import { DealerRole } from '@dealconnect/shared-types';

export interface AuthenticatedRequest extends Request {
  userContext?: AuthJwtPayload;
}

export function tenantAuthGuard(allowedRoles?: DealerRole[], allowedType: 'user' | 'customer' | 'any' = 'any') {
  const jwtService = new JwtService();

  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'UNAUTHORIZED', 'Missing or invalid Authorization header.');
    }

    const token = authHeader.substring(7);
    const payload = jwtService.verifyToken(token);
    
    if (allowedType !== 'any' && payload.type !== allowedType) {
      throw new ApiError(403, 'FORBIDDEN', `This endpoint requires a ${allowedType} token.`);
    }
    
    req.userContext = payload;

    const currentContext = getTenantContext() || { requestId: `req_${Date.now()}` };

    if (payload.type === 'user') {
      currentContext.userId = payload.sub;
      currentContext.dealerId = payload.dealerId;
      currentContext.role = payload.role;
      currentContext.isPlatformAdmin = payload.isPlatformAdmin || false;

      // Role check
      if (allowedRoles && allowedRoles.length > 0 && !payload.isPlatformAdmin) {
        if (!allowedRoles.includes(payload.role)) {
          throw new ApiError(403, 'FORBIDDEN', 'Insufficient permissions for this action.');
        }
      }
    } else if (payload.type === 'customer') {
      currentContext.dealerId = payload.dealerId;
    }

    runWithTenantContext(currentContext, () => {
      next();
    });
  };
}
