import { PrismaClient } from '@prisma/client';
import { Followup, FollowupStatus, FollowupType } from '@dealconnect/shared-types';
import { ApiError } from '../../common/api-error.js';
import { requireDealerId } from '../../common/tenant-context.js';

export class FollowupsService {
  constructor(private prisma: PrismaClient) {}

  async createFollowup(data: {
    customerId: string;
    requirementId?: string | null;
    assignedUserId?: string | null;
    type: FollowupType;
    dueAt: Date;
    notes?: string | null;
  }): Promise<Followup> {
    const dealerId = requireDealerId();

    const followup = await this.prisma.followup.create({
      data: {
        dealerId,
        customerId: data.customerId,
        requirementId: data.requirementId || null,
        assignedUserId: data.assignedUserId || null,
        type: data.type,
        dueAt: data.dueAt,
        status: FollowupStatus.OPEN,
        notes: data.notes || null,
      },
    });

    return {
      ...followup,
      status: followup.status as FollowupStatus,
      type: followup.type as FollowupType,
    };
  }

  async getDealerFollowups(statusFilter?: FollowupStatus, limit = 50): Promise<Followup[]> {
    const dealerId = requireDealerId();
    const where: any = { dealerId };

    if (statusFilter) {
      where.status = statusFilter;
    }

    const list = await this.prisma.followup.findMany({
      where,
      include: {
        customer: true,
        assignedUser: true,
        requirement: true,
      },
      take: limit,
      orderBy: { dueAt: 'asc' },
    });

    return list.map((f: any) => ({
      ...f,
      status: f.status as FollowupStatus,
      type: f.type as FollowupType,
    }));
  }

  async updateFollowupStatus(followupId: string, status: FollowupStatus, notes?: string): Promise<Followup> {
    const dealerId = requireDealerId();

    const existing = await this.prisma.followup.findFirst({
      where: { id: followupId, dealerId },
    });

    if (!existing) {
      throw new ApiError(404, 'FOLLOWUP_NOT_FOUND', 'Followup record not found.');
    }

    const isCompleted = status === FollowupStatus.COMPLETED;

    const updated = await this.prisma.followup.update({
      where: { id: followupId },
      data: {
        status,
        notes: notes !== undefined ? notes : existing.notes,
        completedAt: isCompleted ? new Date() : null,
      },
    });

    return {
      ...updated,
      status: updated.status as FollowupStatus,
      type: updated.type as FollowupType,
    };
  }
}
