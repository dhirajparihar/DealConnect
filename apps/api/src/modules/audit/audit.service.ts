import { PrismaClient } from '@prisma/client';
import { getTenantContext } from '../../common/tenant-context.js';

export class AuditService {
  constructor(private prisma: PrismaClient) {}

  async logAction(action: string, entityType: string, entityId?: string, metadata?: Record<string, any>, ipAddress?: string, userAgent?: string) {
    const context = getTenantContext();
    return this.prisma.auditLog.create({
      data: {
        dealerId: context?.dealerId || null,
        userId: context?.userId || null,
        action,
        entityType,
        entityId: entityId || null,
        metadata: metadata ? (metadata as any) : undefined,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      },
    });
  }
}
