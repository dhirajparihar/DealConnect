import { PrismaClient } from '@prisma/client';
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
  constructor(private prisma: PrismaClient) {}

  async getMetrics(): Promise<DashboardMetrics> {
    const dealerId = requireDealerId();
    const now = new Date();

    const [
      activeCustomersCount,
      activeRequirementsCount,
      availableVehiclesCount,
      newMatchesCount,
      interestedLeadsCount,
      pendingFollowupsCount,
      overdueFollowupsCount,
    ] = await Promise.all([
      this.prisma.customer.count({ where: { dealerId, status: 'active' } }),
      this.prisma.requirement.count({ where: { dealerId, status: 'searching' } }),
      this.prisma.vehicle.count({ where: { dealerId, status: 'available' } }),
      this.prisma.match.count({ where: { dealerId, status: 'new' } }),
      this.prisma.match.count({ where: { dealerId, status: 'interested' } }),
      this.prisma.followup.count({ where: { dealerId, status: 'open' } }),
      this.prisma.followup.count({
        where: {
          dealerId,
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
  }

  async getRecentActivity(limit = 15) {
    const dealerId = requireDealerId();
    return this.prisma.activity.findMany({
      where: { dealerId },
      include: {
        customer: true,
        requirement: true,
        vehicle: true,
        user: true,
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }
}
