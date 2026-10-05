import { PrismaClient } from '@prisma/client';
import { Vehicle, VehicleStatus, FuelType, TransmissionType } from '@dealconnect/shared-types';
import { ApiError } from '../../common/api-error.js';
import { requireDealerId } from '../../common/tenant-context.js';
import { StorageService } from '../storage/storage.service.js';

export class VehiclesService {
  constructor(
    private prisma: PrismaClient,
    private storageService: StorageService
  ) {}

  async createVehicle(data: {
    stockNumber: string;
    make: string;
    model: string;
    variant?: string | null;
    year: number;
    price: number;
    fuel?: FuelType | null;
    transmission?: TransmissionType | null;
    kilometers?: number | null;
    locationLat?: number | null;
    locationLng?: number | null;
    description?: string | null;
    status?: VehicleStatus;
  }): Promise<Vehicle> {
    const dealerId = requireDealerId();

    const existing = await this.prisma.vehicle.findUnique({
      where: {
        dealerId_stockNumber: {
          dealerId,
          stockNumber: data.stockNumber,
        },
      },
    });

    if (existing) {
      throw new ApiError(409, 'STOCK_NUMBER_EXISTS', `Vehicle stock number '${data.stockNumber}' already exists for this dealer.`);
    }

    return this.prisma.$transaction(async (tx) => {
      const vehicle = await tx.vehicle.create({
        data: {
          dealerId,
          stockNumber: data.stockNumber,
          make: data.make,
          model: data.model,
          variant: data.variant || null,
          year: data.year,
          price: data.price,
          fuel: data.fuel || null,
          transmission: data.transmission || null,
          kilometers: data.kilometers || null,
          locationLat: data.locationLat !== undefined ? data.locationLat : null,
          locationLng: data.locationLng !== undefined ? data.locationLng : null,
          description: data.description || null,
          status: data.status || VehicleStatus.AVAILABLE,
        },
      });

      // Emit Outbox Event VehicleCreated
      await tx.outboxEvent.create({
        data: {
          dealerId,
          eventType: 'VehicleCreated',
          aggregateType: 'Vehicle',
          aggregateId: vehicle.id,
          payload: {
            vehicleId: vehicle.id,
            dealerId,
            make: vehicle.make,
            model: vehicle.model,
            year: vehicle.year,
            price: Number(vehicle.price),
            fuel: vehicle.fuel,
            transmission: vehicle.transmission,
            status: vehicle.status,
          },
          status: 'pending',
        },
      });

      return {
        ...vehicle,
        price: Number(vehicle.price),
        status: vehicle.status as VehicleStatus,
        fuel: vehicle.fuel as FuelType | null,
        transmission: vehicle.transmission as TransmissionType | null,
      };
    });
  }

  async getVehicleById(id: string): Promise<Vehicle> {
    const dealerId = requireDealerId();
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id, dealerId },
      include: { vehicleMedia: { orderBy: { sortOrder: 'asc' } } },
    });

    if (!vehicle) {
      throw new ApiError(404, 'VEHICLE_NOT_FOUND', 'Vehicle not found in inventory.');
    }

    return {
      ...vehicle,
      price: Number(vehicle.price),
      status: vehicle.status as VehicleStatus,
      fuel: vehicle.fuel as FuelType | null,
      transmission: vehicle.transmission as TransmissionType | null,
      media: vehicle.vehicleMedia.map((m) => ({
        ...m,
        url: this.storageService.getPublicUrl(m.storageKey),
      })),
    };
  }

  async searchVehicles(filters?: {
    status?: VehicleStatus;
    make?: string;
    model?: string;
    minPrice?: number;
    maxPrice?: number;
    minYear?: number;
    maxYear?: number;
    fuel?: FuelType;
    transmission?: TransmissionType;
    limit?: number;
  }): Promise<Vehicle[]> {
    const dealerId = requireDealerId();
    const where: any = { dealerId };

    if (filters?.status) where.status = filters.status;
    if (filters?.make) where.make = { equals: filters.make, mode: 'insensitive' };
    if (filters?.model) where.model = { contains: filters.model, mode: 'insensitive' };
    if (filters?.minPrice || filters?.maxPrice) {
      where.price = {};
      if (filters.minPrice) where.price.gte = filters.minPrice;
      if (filters.maxPrice) where.price.lte = filters.maxPrice;
    }
    if (filters?.minYear || filters?.maxYear) {
      where.year = {};
      if (filters.minYear) where.year.gte = filters.minYear;
      if (filters.maxYear) where.year.lte = filters.maxYear;
    }
    if (filters?.fuel) where.fuel = filters.fuel;
    if (filters?.transmission) where.transmission = filters.transmission;

    const vehicles = await this.prisma.vehicle.findMany({
      where,
      include: { vehicleMedia: { orderBy: { sortOrder: 'asc' } } },
      take: filters?.limit || 50,
      orderBy: { createdAt: 'desc' },
    });

    return vehicles.map((v) => ({
      ...v,
      price: Number(v.price),
      status: v.status as VehicleStatus,
      fuel: v.fuel as FuelType | null,
      transmission: v.transmission as TransmissionType | null,
      media: v.vehicleMedia.map((m) => ({
        ...m,
        url: this.storageService.getPublicUrl(m.storageKey),
      })),
    }));
  }

  async updateVehicleStatus(vehicleId: string, newStatus: VehicleStatus): Promise<Vehicle> {
    const dealerId = requireDealerId();
    const existing = await this.getVehicleById(vehicleId);

    return this.prisma.$transaction(async (tx) => {
      const isSold = newStatus === VehicleStatus.SOLD;

      const updated = await tx.vehicle.update({
        where: { id: vehicleId },
        data: {
          status: newStatus,
          soldAt: isSold ? new Date() : null,
          updatedAt: new Date(),
        },
      });

      // Emit VehicleSold / VehicleUpdated outbox event
      await tx.outboxEvent.create({
        data: {
          dealerId,
          eventType: isSold ? 'VehicleSold' : 'VehicleUpdated',
          aggregateType: 'Vehicle',
          aggregateId: vehicleId,
          payload: {
            vehicleId,
            dealerId,
            status: newStatus,
          },
          status: 'pending',
        },
      });

      return {
        ...updated,
        price: Number(updated.price),
        status: updated.status as VehicleStatus,
        fuel: updated.fuel as FuelType | null,
        transmission: updated.transmission as TransmissionType | null,
      };
    });
  }

  async addVehicleMedia(vehicleId: string, storageKey: string, mediaType = 'image') {
    const dealerId = requireDealerId();
    await this.getVehicleById(vehicleId); // verifies existence & tenant access

    return this.prisma.vehicleMedia.create({
      data: {
        dealerId,
        vehicleId,
        storageKey,
        mediaType,
      },
    });
  }
}
