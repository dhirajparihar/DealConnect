import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { prisma } from './database/prisma.service.js';
import { requestIdMiddleware } from './common/request-id.middleware.js';
import { sendSuccessResponse, sendErrorResponse } from './common/api-error.js';
import { Logger } from './common/logger.js';

// Services
import { DealersService } from './modules/dealers/dealers.service.js';
import { OtpService } from './modules/auth/otp.service.js';
import { JwtService } from './modules/auth/jwt.service.js';
import { AuthService } from './modules/auth/auth.service.js';
import { CustomersService } from './modules/customers/customers.service.js';
import { RequirementsService } from './modules/requirements/requirements.service.js';
import { StorageService } from './modules/storage/storage.service.js';
import { VehiclesService } from './modules/vehicles/vehicles.service.js';
import { MatchingService } from './modules/matching/matching.service.js';
import { MockMessagingProvider } from './modules/notifications/mock-messaging.provider.js';
import { NotificationsService } from './modules/notifications/notifications.service.js';
import { FollowupsService } from './modules/followups/followups.service.js';
import { DashboardService } from './modules/dashboard/dashboard.service.js';
import { OutboxService } from './modules/outbox/outbox.service.js';
import { OutboxWorker } from './modules/outbox/outbox.worker.js';

// Routers
import { createAuthRouter } from './modules/auth/auth.controller.js';
import { createCustomerRouter } from './modules/customers/customers.controller.js';
import { createRequirementRouter } from './modules/requirements/requirements.controller.js';
import { createVehicleRouter } from './modules/vehicles/vehicles.controller.js';
import { createMatchingRouter } from './modules/matching/matching.controller.js';
import { createWebhookRouter } from './modules/notifications/webhooks.controller.js';
import { createDashboardRouter } from './modules/dashboard/dashboard.controller.js';

dotenv.config();

export function createApp() {
  const app = express();

  // Security Headers & CORS
  app.use(helmet());
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: '10mb' }));
  app.use(requestIdMiddleware);

  // Rate Limiter for public API
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests from this IP.' } },
  });
  app.use('/api/', apiLimiter);

  // Initialize Domain Services
  const dealersService = new DealersService(prisma);
  const otpService = new OtpService();
  const jwtService = new JwtService();
  const authService = new AuthService(prisma, otpService, jwtService, dealersService);
  const customersService = new CustomersService(prisma);
  const requirementsService = new RequirementsService(prisma);
  const storageService = new StorageService();
  const vehiclesService = new VehiclesService(prisma, storageService);
  const matchingService = new MatchingService(prisma);
  const messagingProvider = new MockMessagingProvider();
  const notificationsService = new NotificationsService(prisma, messagingProvider);
  const followupsService = new FollowupsService(prisma);
  const dashboardService = new DashboardService(prisma);

  // Outbox Event Worker & Handlers setup
  const outboxService = new OutboxService(prisma);
  outboxService.registerHandler('VehicleCreated', async (ev) => {
    await matchingService.matchVehicleAgainstRequirements(ev.aggregateId);
  });
  outboxService.registerHandler('VehicleUpdated', async (ev) => {
    await matchingService.matchVehicleAgainstRequirements(ev.aggregateId);
  });
  outboxService.registerHandler('RequirementCreated', async (ev) => {
    await matchingService.matchRequirementAgainstVehicles(ev.aggregateId);
  });
  outboxService.registerHandler('RequirementUpdated', async (ev) => {
    await matchingService.matchRequirementAgainstVehicles(ev.aggregateId);
  });
  outboxService.registerHandler('MatchCreated', async (ev) => {
    await notificationsService.queueMatchNotification(ev.aggregateId);
  });
  outboxService.registerHandler('CustomerInterested', async (ev) => {
    Logger.info(`Customer interested in match ${ev.payload.matchId}, followup ${ev.payload.followupId} created.`);
  });

  const outboxWorker = new OutboxWorker(outboxService);
  if (process.env.NODE_ENV !== 'test') {
    outboxWorker.start();
  }

  // Health Check Endpoint
  app.get('/api/v1/health', async (req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return sendSuccessResponse(res, { status: 'healthy', timestamp: new Date().toISOString() });
    } catch (err: any) {
      return sendErrorResponse(res, err);
    }
  });

  // Mount API Routers under /api/v1
  app.use('/api/v1', createAuthRouter(authService));
  app.use('/api/v1', createCustomerRouter(customersService));
  app.use('/api/v1', createRequirementRouter(requirementsService));
  app.use('/api/v1', createVehicleRouter(vehiclesService, storageService));
  app.use('/api/v1', createMatchingRouter(matchingService, prisma));
  app.use('/api/v1', createWebhookRouter(notificationsService, messagingProvider));
  app.use('/api/v1', createDashboardRouter(dashboardService));

  return app;
}

if (require.main === module) {
  const port = process.env.PORT || 4000;
  const app = createApp();
  app.listen(port, () => {
    Logger.info(`DealConnect API server running on port ${port}`);
  });
}
