import { PrismaClient } from '@prisma/client';
import { Customer, CustomerStatus } from '@dealconnect/shared-types';
import { ApiError } from '../../common/api-error.js';
import { requireDealerId } from '../../common/tenant-context.js';

export class CustomersService {
  constructor(private prisma: PrismaClient) {}

  async getCustomerById(customerId: string): Promise<Customer> {
    const dealerId = requireDealerId();
    const customer = await this.prisma.customer.findFirst({
      where: {
        id: customerId,
        dealerId,
      },
    });

    if (!customer) {
      throw new ApiError(404, 'CUSTOMER_NOT_FOUND', 'Customer profile not found.');
    }

    return {
      ...customer,
      status: customer.status as CustomerStatus,
    };
  }

  async updateCustomerProfile(customerId: string, data: { name?: string; email?: string | null }): Promise<Customer> {
    const dealerId = requireDealerId();
    const existing = await this.getCustomerById(customerId);

    const updated = await this.prisma.customer.update({
      where: { id: existing.id },
      data: {
        name: data.name !== undefined ? data.name : existing.name,
        email: data.email !== undefined ? data.email : existing.email,
        updatedAt: new Date(),
      },
    });

    return {
      ...updated,
      status: updated.status as CustomerStatus,
    };
  }

  async recordConsent(customerId: string, consentType: string, channel: string) {
    const dealerId = requireDealerId();
    return this.prisma.customerConsent.create({
      data: {
        dealerId,
        customerId,
        consentType,
        channel,
        grantedAt: new Date(),
        source: 'customer_otp_verification',
        policyVersion: 'v1.0',
      },
    });
  }

  async searchDealerCustomers(query?: string, status?: string, limit = 25) {
    const dealerId = requireDealerId();
    const whereClause: any = { dealerId };

    if (status) {
      whereClause.status = status;
    }

    if (query) {
      whereClause.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { normalizedPhone: { contains: query } },
        { email: { contains: query, mode: 'insensitive' } },
      ];
    }

    const customers = await this.prisma.customer.findMany({
      where: whereClause,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    return customers.map((c: any) => ({
      ...c,
      status: c.status as CustomerStatus,
    }));
  }
}
