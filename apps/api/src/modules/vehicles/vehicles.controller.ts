import { Router, Response, NextFunction } from 'express';
import { VehiclesService } from './vehicles.service.js';
import { StorageService } from '../storage/storage.service.js';
import { sendSuccessResponse, sendErrorResponse } from '../../common/api-error.js';
import { CreateVehicleSchema, UpdateVehicleSchema } from '@dealconnect/validation';
import { tenantAuthGuard, AuthenticatedRequest } from '../auth/tenant-auth.guard.js';
import { VehicleStatus, DealerRole } from '@dealconnect/shared-types';

export function createVehicleRouter(vehiclesService: VehiclesService, storageService: StorageService): Router {
  const router = Router();

  // POST /vehicles (Create vehicle inventory item)
  router.post('/vehicles', tenantAuthGuard([DealerRole.OWNER, DealerRole.MANAGER]), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const parsed = CreateVehicleSchema.parse(req.body);
      const vehicle = await vehiclesService.createVehicle(parsed);
      return sendSuccessResponse(res, vehicle, 201);
    } catch (err) {
      return sendErrorResponse(res, err);
    }
  });

  // GET /vehicles (Search inventory)
  router.get('/vehicles', tenantAuthGuard(), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { status, make, model, minPrice, maxPrice, minYear, maxYear, fuel, transmission, limit } = req.query;
      const vehicles = await vehiclesService.searchVehicles({
        status: status as VehicleStatus,
        make: make as string,
        model: model as string,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        minYear: minYear ? Number(minYear) : undefined,
        maxYear: maxYear ? Number(maxYear) : undefined,
        fuel: fuel as any,
        transmission: transmission as any,
        limit: limit ? Number(limit) : undefined,
      });
      return sendSuccessResponse(res, vehicles);
    } catch (err) {
      return sendErrorResponse(res, err);
    }
  });

  // GET /vehicles/:id
  router.get('/vehicles/:id', tenantAuthGuard(), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const vehicle = await vehiclesService.getVehicleById(req.params.id);
      return sendSuccessResponse(res, vehicle);
    } catch (err) {
      return sendErrorResponse(res, err);
    }
  });

  // PATCH /vehicles/:id/status
  router.patch('/vehicles/:id/status', tenantAuthGuard([DealerRole.OWNER, DealerRole.MANAGER]), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { status } = req.body;
      if (!status) {
        throw new Error('Status parameter is required');
      }
      const updated = await vehiclesService.updateVehicleStatus(req.params.id, status as VehicleStatus);
      return sendSuccessResponse(res, updated);
    } catch (err) {
      return sendErrorResponse(res, err);
    }
  });

  // POST /vehicles/:id/media/upload-url (Generate presigned upload URL)
  router.post('/vehicles/:id/media/upload-url', tenantAuthGuard([DealerRole.OWNER, DealerRole.MANAGER]), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const dealerId = req.userContext?.dealerId;
      if (!dealerId) throw new Error('Dealer context required');

      const { filename, mimeType, sizeBytes } = req.body;
      const presigned = await storageService.getPresignedUploadUrl(dealerId, req.params.id, filename, mimeType, sizeBytes);
      return sendSuccessResponse(res, presigned);
    } catch (err) {
      return sendErrorResponse(res, err);
    }
  });

  return router;
}
