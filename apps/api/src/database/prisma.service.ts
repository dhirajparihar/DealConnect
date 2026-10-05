import { PrismaClient } from '@prisma/client';
import { getTenantContext } from '../common/tenant-context.js';

export class PrismaService extends PrismaClient {
  private static instance: PrismaService;

  private constructor() {
    super({
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
    });
  }

  public static getInstance(): PrismaService {
    if (!PrismaService.instance) {
      PrismaService.instance = new PrismaService();
    }
    return PrismaService.instance;
  }

  /**
   * Executes a transaction with RLS context variables set for PostgreSQL.
   */
  public async executeWithRls<T>(fn: (prisma: PrismaClient) => Promise<T>): Promise<T> {
    const context = getTenantContext();
    return this.$transaction(async (tx: any) => {
      if (context?.dealerId) {
        await tx.$executeRawUnsafe(`SET LOCAL app.current_dealer_id = '${context.dealerId}';`);
      }
      if (context?.isPlatformAdmin) {
        await tx.$executeRawUnsafe(`SET LOCAL app.is_platform_admin = 'true';`);
      }
      return fn(tx as PrismaClient);
    });
  }
}

export const prisma = PrismaService.getInstance();
