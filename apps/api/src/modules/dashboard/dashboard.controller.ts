import { Router, Response } from 'express';
import { DashboardService } from './dashboard.service.js';
import { sendSuccessResponse, sendErrorResponse } from '../../common/api-error.js';
import { AuthenticatedRequest, tenantAuthGuard } from '../auth/tenant-auth.guard.js';

export function createDashboardRouter(dashboardService: DashboardService): Router {
  const router = Router();
  const authGuard = tenantAuthGuard();

  // GET /dashboard/metrics
  router.get('/dashboard/metrics', authGuard, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const metrics = await dashboardService.getMetrics();
      return sendSuccessResponse(res, metrics);
    } catch (err) {
      return sendErrorResponse(res, err);
    }
  });

  // GET /dashboard/activity
  router.get('/dashboard/activity', authGuard, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const activity = await dashboardService.getRecentActivity();
      return sendSuccessResponse(res, activity);
    } catch (err) {
      return sendErrorResponse(res, err);
    }
  });

  return router;
}
