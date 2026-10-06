import { PrismaClient } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service.js';
import { requireDealerId } from '../../common/tenant-context.js';

export interface DashboardMetrics {
  activeCustomersCount: number;
  activeRequirementsCount: number;
  availableVehiclesCount: number;
  newMatchesCount: number;
  interestedLeadsCount: number;
  pendingFollowupsCount: number;
  overdueFollowupsCount: number;
}

export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getMetrics(): Promise<DashboardMetrics> {
    const dealerId = requireDealerId();
    const now = new Date();

    return this.prisma.executeWithRls(async (tx: any) => {
      const [
        activeCustomersCount,
        activeRequirementsCount,
        availableVehiclesCount,
        newMatchesCount,
        interestedLeadsCount,
        pendingFollowupsCount,
        overdueFollowupsCount,
      ] = await Promise.all([
        tx.customer.count({ where: { status: 'active' } }),
        tx.requirement.count({ where: { status: 'searching' } }),
        tx.vehicle.count({ where: { status: 'available' } }),
        tx.match.count({ where: { status: 'new' } }),
        tx.match.count({ where: { status: 'interested' } }),
        tx.followup.count({ where: { status: 'open' } }),
        tx.followup.count({
          where: {
            status: 'open',
            dueAt: { lt: now },
          },
        }),
      ]);

      return {
        activeCustomersCount,
        activeRequirementsCount,
        availableVehiclesCount,
        newMatchesCount,
        interestedLeadsCount,
        pendingFollowupsCount,
        overdueFollowupsCount,
      };
    });
  }

  async getRecentActivity(limit = 15) {
    const dealerId = requireDealerId();
    return this.prisma.executeWithRls(async (tx: any) => {
      return tx.activity.findMany({
        where: {},
        include: {
          customer: true,
          requirement: true,
          vehicle: true,
          user: true,
        },
        take: limit,
        orderBy: { createdAt: 'desc' },
      });
    });
  }
}
