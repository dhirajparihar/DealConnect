import { Router, Request, Response, NextFunction } from 'express';
import { NotificationsService } from './notifications.service.js';
import { MessagingProvider } from './messaging-provider.interface.js';
import { sendSuccessResponse, sendErrorResponse, ApiError } from '../../common/api-error.js';
import { redisClient } from '../../common/redis.js';
import crypto from 'crypto';

export function createWebhookRouter(notificationsService: NotificationsService, messagingProvider: MessagingProvider): Router {
  const router = Router();

  // POST /webhooks/whatsapp
  router.post('/webhooks/whatsapp', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const signature = (req.headers['x-hub-signature-256'] as string) || (req.headers['x-provider-signature'] as string) || '';
      const rawBody = JSON.stringify(req.body);

      // Signature verification
      const isValid = messagingProvider.verifyWebhookSignature(signature, rawBody);
      if (!isValid && process.env.NODE_ENV === 'production') {
        throw new ApiError(401, 'INVALID_WEBHOOK_SIGNATURE', 'WhatsApp webhook signature verification failed.');
      }

      const event = messagingProvider.parseWebhookEvent(req.body);
      if (event) {
        const eventHash = crypto.createHash('sha256').update(rawBody).digest('hex');
        const idempotencyKey = `webhook:whatsapp:${event.providerMessageId}:${eventHash}`;
        
        // Use SET NX to acquire an atomic lock / idempotency check
        const isNew = await redisClient.set(idempotencyKey, '1', 'NX', 'EX', 7 * 24 * 60 * 60);
        
        if (isNew) {
          await notificationsService.handleWebhookStatusUpdate(event.providerMessageId, event.status, event.failureReason);
        }
      }

      return sendSuccessResponse(res, { status: 'processed' });
    } catch (err) {
      return sendErrorResponse(res, err);
    }
  });

  return router;
}
