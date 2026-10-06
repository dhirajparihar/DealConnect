import { Router, Response, NextFunction } from 'express';
import { MatchingService } from './matching.service.js';
import { PrismaClient } from '@prisma/client';
import { sendSuccessResponse, sendErrorResponse } from '../../common/api-error.js';
import { tenantAuthGuard, AuthenticatedRequest } from '../auth/tenant-auth.guard.js';
import { MatchStatus, FollowupType, FollowupStatus } from '@dealconnect/shared-types';
import { requireDealerId } from '../../common/tenant-context.js';

export function createMatchingRouter(matchingService: MatchingService, prisma: PrismaClient): Router {
  const router = Router();

  // GET /public/matches (List authenticated customer's vehicle matches)
  router.get('/public/matches', tenantAuthGuard(undefined, 'customer'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const customerId = req.userContext?.sub;
      const dealerId = requireDealerId();

      const matches = await prisma.match.findMany({
        where: {
          dealerId,
          requirement: { customerId },
        },
        include: {
          vehicle: {
            include: { vehicleMedia: { orderBy: { sortOrder: 'asc' } } },
          },
          requirement: { include: { preferences: true } },
        },
        orderBy: { score: 'desc' },
      });

      return sendSuccessResponse(res, matches);
    } catch (err) {
      return sendErrorResponse(res, err);
    }
  });

  // GET /public/matches/:id (Get specific match with score breakdown)
  router.get('/public/matches/:id', tenantAuthGuard(undefined, 'customer'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const customerId = req.userContext?.sub;
      const dealerId = requireDealerId();
      const matchId = req.params.id;

      const match = await prisma.match.findFirst({
        where: {
          id: matchId,
          dealerId,
          requirement: { customerId },
        },
        include: {
          vehicle: {
            include: { vehicleMedia: { orderBy: { sortOrder: 'asc' } } },
          },
          requirement: { include: { preferences: true } },
          dealer: true,
        },
      });

      if (!match) {
        throw new Error('Match record not found.');
      }

      return sendSuccessResponse(res, match);
    } catch (err) {
      return sendErrorResponse(res, err);
    }
  });

  // POST /public/matches/:id/interested (AC10: Customer interested response)
  router.post('/public/matches/:id/interested', tenantAuthGuard(undefined, 'customer'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const customerId = req.userContext?.sub;
      const dealerId = requireDealerId();
      const matchId = req.params.id;

      const match = await prisma.match.findFirst({
        where: {
          id: matchId,
          dealerId,
          requirement: { customerId },
        },
        include: { vehicle: true, requirement: true },
      });

      if (!match) {
        throw new Error('Match record not found.');
      }

      if (match.status === MatchStatus.INTERESTED) {
        return sendSuccessResponse(res, {
          status: match.status,
          followupCreated: false,
          message: 'Already marked as interested.',
        });
      }

      const result = await prisma.$transaction(async (tx: any) => {
        // Update match status to INTERESTED
        const updatedMatch = await tx.match.update({
          where: { id: matchId },
          data: {
            status: MatchStatus.INTERESTED,
            updatedAt: new Date(),
          },
        });

        // Record customer activity
        await tx.activity.create({
          data: {
            dealerId,
            customerId: match.requirement.customerId,
            requirementId: match.requirementId,
            vehicleId: match.vehicleId,
            activityType: 'CustomerInterested',
            metadata: { matchId: match.id, score: Number(match.score) },
          },
        });

        // Create dealer follow-up (due in 24 hours)
        const followup = await tx.followup.create({
          data: {
            dealerId,
            customerId: match.requirement.customerId,
            requirementId: match.requirementId,
            type: FollowupType.CALL,
            dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            status: FollowupStatus.OPEN,
            notes: `Customer expressed interest in ${match.vehicle.make} ${match.vehicle.model} (${match.vehicle.year})`,
          },
        });

        // Outbox event CustomerInterested
        await tx.outboxEvent.create({
          data: {
            dealerId,
            eventType: 'CustomerInterested',
            aggregateType: 'Match',
            aggregateId: matchId,
            payload: {
              matchId,
              dealerId,
              customerId: match.requirement.customerId,
              vehicleId: match.vehicleId,
              followupId: followup.id,
            },
            status: 'pending',
          },
        });

        return {
          status: updatedMatch.status,
          followupCreated: true,
          followupId: followup.id,
        };
      });

      return sendSuccessResponse(res, result);
    } catch (err) {
      return sendErrorResponse(res, err);
    }
  });

  return router;
}
