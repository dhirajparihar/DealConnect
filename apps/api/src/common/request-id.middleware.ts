import { Request, Response, NextFunction } from 'express';
import { runWithTenantContext, getTenantContext } from './tenant-context.js';

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
  const requestId = (req.headers['x-request-id'] as string) || `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  res.setHeader('X-Request-ID', requestId);

  const existingStore = getTenantContext() || { requestId };
  existingStore.requestId = requestId;

  runWithTenantContext(existingStore, () => {
    next();
  });
}
