import { PrismaClient } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service.js';
import { Vehicle, VehicleStatus, FuelType, TransmissionType } from '@dealconnect/shared-types';
import { ApiError } from '../../common/api-error.js';
import { requireDealerId } from '../../common/tenant-context.js';
import { StorageService } from '../storage/storage.service.js';

export class VehiclesService {
  constructor(
    private prisma: PrismaService,
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

    return this.prisma.executeWithRls(async (tx: any) => {
      const existing = await tx.vehicle.findUnique({
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
        locationLat: vehicle.locationLat ? Number(vehicle.locationLat) : null,
        locationLng: vehicle.locationLng ? Number(vehicle.locationLng) : null,
        status: vehicle.status as VehicleStatus,
        fuel: vehicle.fuel as FuelType | null,
        transmission: vehicle.transmission as TransmissionType | null,
      } as any as Vehicle;
    });
  }

  async getVehicleById(id: string): Promise<Vehicle> {
    const dealerId = requireDealerId();
    const vehicle = await this.prisma.executeWithRls(async (tx: any) => {
      return tx.vehicle.findFirst({
        where: { id },
        include: { vehicleMedia: { orderBy: { sortOrder: 'asc' } } },
      });
    });

    if (!vehicle) {
      throw new ApiError(404, 'VEHICLE_NOT_FOUND', 'Vehicle not found in inventory.');
    }

    return {
      ...vehicle,
      price: Number(vehicle.price),
      locationLat: vehicle.locationLat ? Number(vehicle.locationLat) : null,
      locationLng: vehicle.locationLng ? Number(vehicle.locationLng) : null,
      status: vehicle.status as VehicleStatus,
      fuel: vehicle.fuel as FuelType | null,
      transmission: vehicle.transmission as TransmissionType | null,
      media: vehicle.vehicleMedia.map((m: any) => ({
        ...m,
        url: this.storageService.getPublicUrl(m.storageKey),
      })),
    } as any as Vehicle;
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
    cursor?: string;
  }): Promise<{ items: Vehicle[], nextCursor: string | null }> {
    const dealerId = requireDealerId();
    const where: any = {};

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

    const limit = filters?.limit || 50;

    const vehicles = await this.prisma.executeWithRls(async (tx: any) => {
      return tx.vehicle.findMany({
        where,
        include: { vehicleMedia: { orderBy: { sortOrder: 'asc' } } },
        take: limit + 1, // Fetch one extra to determine if there is a next page
        ...(filters?.cursor ? { cursor: { id: filters.cursor }, skip: 1 } : {}),
        orderBy: { createdAt: 'desc' },
      });
    });

    let nextCursor: string | null = null;
    if (vehicles.length > limit) {
      const nextItem = vehicles.pop();
      nextCursor = nextItem.id;
    }

    return {
      items: vehicles.map((v: any) => ({
      ...v,
      price: Number(v.price),
      status: v.status as VehicleStatus,
      fuel: v.fuel as FuelType | null,
      transmission: v.transmission as TransmissionType | null,
      media: v.vehicleMedia.map((m: any) => ({
        ...m,
        url: this.storageService.getPublicUrl(m.storageKey),
      })),
    })),
    nextCursor,
    };
  }

  async updateVehicleStatus(vehicleId: string, newStatus: VehicleStatus): Promise<Vehicle> {
    const dealerId = requireDealerId();
    const existing = await this.getVehicleById(vehicleId);

    return this.prisma.executeWithRls(async (tx: any) => {
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

    return this.prisma.executeWithRls(async (tx: any) => {
      return tx.vehicleMedia.create({
        data: {
          dealerId,
          vehicleId,
          storageKey,
          mediaType,
        },
      });
    });
  }
}
