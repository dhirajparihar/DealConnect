import { Router, Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service.js';
import { sendSuccessResponse, sendErrorResponse } from '../../common/api-error.js';
import { OtpRequestSchema, OtpVerifySchema } from '@dealconnect/validation';

export function createAuthRouter(authService: AuthService): Router {
  const router = Router();

  // POST /public/:dealerSlug/auth/otp/request
  router.post('/public/:dealerSlug/auth/otp/request', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { dealerSlug } = req.params;
      const parsed = OtpRequestSchema.parse(req.body);
      const result = await authService.requestCustomerOtp(dealerSlug, parsed.phone);
      return sendSuccessResponse(res, result);
    } catch (err) {
      return sendErrorResponse(res, err);
    }
  });

  // POST /public/:dealerSlug/auth/otp/verify
  router.post('/public/:dealerSlug/auth/otp/verify', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { dealerSlug } = req.params;
      const parsed = OtpVerifySchema.parse(req.body);
      const result = await authService.verifyCustomerOtp(dealerSlug, parsed.challengeId, parsed.otp);
      return sendSuccessResponse(res, result);
    } catch (err) {
      return sendErrorResponse(res, err);
    }
  });

  // POST /public/dealer-auth/login
  router.post('/public/dealer-auth/login', async (req: Request, res: Response) => {
    try {
      const { dealerSlug, email } = req.body;
      const slug = dealerSlug || 'sharma-motors';
      const result = await authService.loginDealerUser(slug, email);
      return sendSuccessResponse(res, result);
    } catch (err) {
      return sendErrorResponse(res, err);
    }
  });

  // POST /public/admin-auth/login
  router.post('/public/admin-auth/login', async (req: Request, res: Response) => {
    try {
      const result = await authService.loginPlatformAdmin();
      return sendSuccessResponse(res, result);
    } catch (err) {
      return sendErrorResponse(res, err);
    }
  });

  return router;
}
