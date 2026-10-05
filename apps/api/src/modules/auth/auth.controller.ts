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

  return router;
}
