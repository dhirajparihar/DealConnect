import { PrismaClient } from '@prisma/client';
import { Requirement, RequirementStatus, RequirementPriority, FuelType, TransmissionType } from '@dealconnect/shared-types';
import { ApiError } from '../../common/api-error.js';
import { requireDealerId } from '../../common/tenant-context.js';

export class RequirementsService {
  constructor(private prisma: PrismaClient) {}

  async createRequirement(
    customerId: string,
    data: {
      make?: string | null;
      model?: string | null;
      variant?: string | null;
      minYear?: number | null;
      maxYear?: number | null;
      minPrice?: number | null;
      maxPrice?: number | null;
      fuel?: FuelType | null;
      transmission?: TransmissionType | null;
      maxKm?: number | null;
      location?: { lat: number; lng: number } | null;
      radiusKm?: number | null;
      color?: string | null;
      notes?: string | null;
      priority?: RequirementPriority;
    }
  ): Promise<Requirement> {
    const dealerId = requireDealerId();

    return this.prisma.$transaction(async (tx) => {
      const requirement = await tx.requirement.create({
        data: {
          dealerId,
          customerId,
          status: RequirementStatus.SEARCHING,
          priority: data.priority || RequirementPriority.NORMAL,
          source: 'customer_portal',
          notes: data.notes || null,
        },
      });

      const preferences = await tx.requirementPreference.create({
        data: {
          requirementId: requirement.id,
          make: data.make || null,
          model: data.model || null,
          variant: data.variant || null,
          minYear: data.minYear || null,
          maxYear: data.maxYear || null,
          minPrice: data.minPrice !== undefined ? data.minPrice : null,
          maxPrice: data.maxPrice !== undefined ? data.maxPrice : null,
          fuel: data.fuel || null,
          transmission: data.transmission || null,
          maxKm: data.maxKm || null,
          locationLat: data.location?.lat !== undefined ? data.location.lat : null,
          locationLng: data.location?.lng !== undefined ? data.location.lng : null,
          radiusKm: data.radiusKm || null,
          color: data.color || null,
        },
      });

      // Transactional Outbox Event
      await tx.outboxEvent.create({
        data: {
          dealerId,
          eventType: 'RequirementCreated',
          aggregateType: 'Requirement',
          aggregateId: requirement.id,
          payload: {
            requirementId: requirement.id,
            customerId,
            dealerId,
            make: data.make,
            model: data.model,
            minPrice: data.minPrice,
            maxPrice: data.maxPrice,
          },
          status: 'pending',
        },
      });

      return {
        ...requirement,
        status: requirement.status as RequirementStatus,
        priority: requirement.priority as RequirementPriority,
        preferences: {
          ...preferences,
          minPrice: preferences.minPrice ? Number(preferences.minPrice) : null,
          maxPrice: preferences.maxPrice ? Number(preferences.maxPrice) : null,
          locationLat: preferences.locationLat ? Number(preferences.locationLat) : null,
          locationLng: preferences.locationLng ? Number(preferences.locationLng) : null,
          radiusKm: preferences.radiusKm ? Number(preferences.radiusKm) : null,
          fuel: preferences.fuel as FuelType | null,
          transmission: preferences.transmission as TransmissionType | null,
        },
      };
    });
  }

  async getCustomerRequirements(customerId: string): Promise<Requirement[]> {
    const dealerId = requireDealerId();
    const requirements = await this.prisma.requirement.findMany({
      where: {
        dealerId,
        customerId,
      },
      include: {
        preferences: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return requirements.map((r) => ({
      ...r,
      status: r.status as RequirementStatus,
      priority: r.priority as RequirementPriority,
      preferences: r.preferences
        ? {
            ...r.preferences,
            minPrice: r.preferences.minPrice ? Number(r.preferences.minPrice) : null,
            maxPrice: r.preferences.maxPrice ? Number(r.preferences.maxPrice) : null,
            locationLat: r.preferences.locationLat ? Number(r.preferences.locationLat) : null,
            locationLng: r.preferences.locationLng ? Number(r.preferences.locationLng) : null,
            radiusKm: r.preferences.radiusKm ? Number(r.preferences.radiusKm) : null,
            fuel: r.preferences.fuel as FuelType | null,
            transmission: r.preferences.transmission as TransmissionType | null,
          }
        : undefined,
    }));
  }

  async updateRequirementStatus(requirementId: string, customerId: string, newStatus: RequirementStatus): Promise<Requirement> {
    const dealerId = requireDealerId();
    const existing = await this.prisma.requirement.findFirst({
      where: {
        id: requirementId,
        dealerId,
        customerId,
      },
    });

    if (!existing) {
      throw new ApiError(404, 'REQUIREMENT_NOT_FOUND', 'Requirement not found.');
    }

    return this.prisma.$transaction(async (tx) => {
      const isClosed = newStatus === RequirementStatus.CLOSED || newStatus === RequirementStatus.PURCHASED_ELSEWHERE;

      const updated = await tx.requirement.update({
        where: { id: requirementId },
        data: {
          status: newStatus,
          closedAt: isClosed ? new Date() : null,
          updatedAt: new Date(),
        },
        include: { preferences: true },
      });

      await tx.outboxEvent.create({
        data: {
          dealerId,
          eventType: isClosed ? 'RequirementClosed' : 'RequirementUpdated',
          aggregateType: 'Requirement',
          aggregateId: requirementId,
          payload: {
            requirementId,
            customerId,
            dealerId,
            status: newStatus,
          },
          status: 'pending',
        },
      });

      return {
        ...updated,
        status: updated.status as RequirementStatus,
        priority: updated.priority as RequirementPriority,
      };
    });
  }
}
