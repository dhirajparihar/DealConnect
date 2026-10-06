import { Router, Response, NextFunction } from 'express';
import { RequirementsService } from './requirements.service.js';
import { sendSuccessResponse, sendErrorResponse } from '../../common/api-error.js';
import { CreateRequirementSchema, UpdateRequirementSchema } from '@dealconnect/validation';
import { tenantAuthGuard, AuthenticatedRequest } from '../auth/tenant-auth.guard.js';

export function createRequirementRouter(requirementsService: RequirementsService): Router {
  const router = Router();

  // POST /public/requirements (Create requirement as authenticated customer)
  router.post('/public/requirements', tenantAuthGuard(undefined, 'customer'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const customerId = req.userContext?.sub;
      if (!customerId) {
        throw new Error('Customer context required');
      }
      const parsed = CreateRequirementSchema.parse(req.body);
      const requirement = await requirementsService.createRequirement(customerId, parsed);
      return sendSuccessResponse(res, { requirementId: requirement.id, status: requirement.status }, 201);
    } catch (err) {
      return sendErrorResponse(res, err);
    }
  });

  // GET /public/requirements (List authenticated customer's requirements)
  router.get('/public/requirements', tenantAuthGuard(undefined, 'customer'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const customerId = req.userContext?.sub;
      if (!customerId) {
        throw new Error('Customer context required');
      }
      const list = await requirementsService.getCustomerRequirements(customerId);
      return sendSuccessResponse(res, list);
    } catch (err) {
      return sendErrorResponse(res, err);
    }
  });

  // PATCH /public/requirements/:id (Update requirement status/pause/close)
  router.patch('/public/requirements/:id', tenantAuthGuard(undefined, 'customer'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const customerId = req.userContext?.sub;
      if (!customerId) {
        throw new Error('Customer context required');
      }
      const { id } = req.params;
      const parsed = UpdateRequirementSchema.parse(req.body);
      if (!parsed.status) {
        throw new Error('Status field is required for update');
      }
      const updated = await requirementsService.updateRequirementStatus(id, customerId, parsed.status);
      return sendSuccessResponse(res, updated);
    } catch (err) {
      return sendErrorResponse(res, err);
    }
  });

  return router;
}
