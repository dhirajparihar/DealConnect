import { Router, Response, NextFunction } from 'express';
import { CustomersService } from './customers.service.js';
import { sendSuccessResponse, sendErrorResponse } from '../../common/api-error.js';
import { CustomerProfileSchema } from '@dealconnect/validation';
import { tenantAuthGuard, AuthenticatedRequest } from '../auth/tenant-auth.guard.js';

export function createCustomerRouter(customersService: CustomersService): Router {
  const router = Router();

  // GET /public/customer/profile (Requires customer JWT token)
  router.get('/public/customer/profile', tenantAuthGuard(undefined, 'customer'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const customerId = req.userContext?.sub;
      if (!customerId) {
        throw new Error('Customer authentication required');
      }
      const profile = await customersService.getCustomerById(customerId);
      return sendSuccessResponse(res, profile);
    } catch (err) {
      return sendErrorResponse(res, err);
    }
  });

  // POST /public/customer/profile
  router.post('/public/customer/profile', tenantAuthGuard(undefined, 'customer'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const customerId = req.userContext?.sub;
      if (!customerId) {
        throw new Error('Customer authentication required');
      }
      const parsed = CustomerProfileSchema.parse(req.body);
      const updated = await customersService.updateCustomerProfile(customerId, parsed);
      return sendSuccessResponse(res, updated);
    } catch (err) {
      return sendErrorResponse(res, err);
    }
  });

  return router;
}
