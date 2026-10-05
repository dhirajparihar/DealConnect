import { PrismaClient } from '@prisma/client';
import { Dealer, DealerStatus } from '@dealconnect/shared-types';
import { ApiError } from '../../common/api-error.js';

export class DealersService {
  constructor(private prisma: PrismaClient) {}

  async createDealer(data: { name: string; slug: string; phone?: string; email?: string }): Promise<Dealer> {
    const existing = await this.prisma.dealer.findUnique({
      where: { slug: data.slug.toLowerCase() },
    });
    if (existing) {
      throw new ApiError(409, 'DEALER_SLUG_EXISTS', `Dealer slug '${data.slug}' is already taken.`);
    }

    const dealer = await this.prisma.dealer.create({
      data: {
        name: data.name,
        slug: data.slug.toLowerCase(),
        phone: data.phone || null,
        email: data.email || null,
        status: DealerStatus.ACTIVE,
      },
    });

    return {
      ...dealer,
      status: dealer.status as DealerStatus,
    };
  }

  async getDealerBySlug(slug: string): Promise<Dealer> {
    const dealer = await this.prisma.dealer.findUnique({
      where: { slug: slug.toLowerCase() },
    });
    if (!dealer || dealer.status !== DealerStatus.ACTIVE) {
      throw new ApiError(404, 'DEALER_NOT_FOUND', `Dealer with slug '${slug}' not found or inactive.`);
    }

    return {
      ...dealer,
      status: dealer.status as DealerStatus,
    };
  }

  async getDealerById(id: string): Promise<Dealer> {
    const dealer = await this.prisma.dealer.findUnique({
      where: { id },
    });
    if (!dealer) {
      throw new ApiError(404, 'DEALER_NOT_FOUND', `Dealer with ID '${id}' not found.`);
    }

    return {
      ...dealer,
      status: dealer.status as DealerStatus,
    };
  }
}
