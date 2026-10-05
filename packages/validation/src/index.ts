import { z } from 'zod';
import {
  FuelType,
  TransmissionType,
  RequirementPriority,
  RequirementStatus,
  VehicleStatus,
  FollowupType,
  FollowupStatus,
} from '@dealconnect/shared-types';

/**
 * Normalizes phone numbers to standard E.164 format.
 * Examples: "+91 98765 43210" -> "+919876543210", "9876543210" -> "+919876543210"
 */
export function normalizePhoneNumber(rawPhone: string): string {
  const cleaned = rawPhone.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+')) {
    return cleaned;
  }
  if (cleaned.length === 10) {
    return `+91${cleaned}`;
  }
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return `+${cleaned}`;
  }
  return `+${cleaned}`;
}

export const PhoneSchema = z.string().transform((val) => normalizePhoneNumber(val)).refine((val) => {
  return /^\+[1-9]\d{7,14}$/.test(val);
}, { message: 'Invalid mobile phone number format' });

// OTP Schemas
export const OtpRequestSchema = z.object({
  phone: PhoneSchema,
});

export const OtpVerifySchema = z.object({
  challengeId: z.string().min(1, 'Challenge ID is required'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

// Customer Profile Schema
export const CustomerProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(160),
  email: z.string().email('Invalid email address').nullable().optional(),
});

// Requirement Schema
export const LocationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const CreateRequirementSchema = z.object({
  make: z.string().max(80).nullable().optional(),
  model: z.string().max(100).nullable().optional(),
  variant: z.string().max(120).nullable().optional(),
  minYear: z.number().int().min(1990).max(new Date().getFullYear() + 1).nullable().optional(),
  maxYear: z.number().int().min(1990).max(new Date().getFullYear() + 1).nullable().optional(),
  minPrice: z.number().min(0).nullable().optional(),
  maxPrice: z.number().min(0).nullable().optional(),
  fuel: z.nativeEnum(FuelType).nullable().optional(),
  transmission: z.nativeEnum(TransmissionType).nullable().optional(),
  maxKm: z.number().int().min(0).nullable().optional(),
  location: LocationSchema.nullable().optional(),
  radiusKm: z.number().min(0).max(1000).nullable().optional(),
  color: z.string().max(50).nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
  priority: z.nativeEnum(RequirementPriority).default(RequirementPriority.NORMAL),
});

export const UpdateRequirementSchema = CreateRequirementSchema.partial().extend({
  status: z.nativeEnum(RequirementStatus).optional(),
});

// Vehicle Schema
export const CreateVehicleSchema = z.object({
  stockNumber: z.string().min(1, 'Stock number is required').max(80),
  make: z.string().min(1, 'Make is required').max(80),
  model: z.string().min(1, 'Model is required').max(100),
  variant: z.string().max(120).nullable().optional(),
  year: z.number().int().min(1990).max(new Date().getFullYear() + 1),
  price: z.number().positive('Price must be greater than 0'),
  fuel: z.nativeEnum(FuelType).nullable().optional(),
  transmission: z.nativeEnum(TransmissionType).nullable().optional(),
  kilometers: z.number().int().min(0).nullable().optional(),
  locationLat: z.number().min(-90).max(90).nullable().optional(),
  locationLng: z.number().min(-180).max(180).nullable().optional(),
  description: z.string().max(2000).nullable().optional(),
  status: z.nativeEnum(VehicleStatus).default(VehicleStatus.AVAILABLE),
});

export const UpdateVehicleSchema = CreateVehicleSchema.partial();

// Followup Schema
export const CreateFollowupSchema = z.object({
  customerId: z.string().uuid(),
  requirementId: z.string().uuid().nullable().optional(),
  assignedUserId: z.string().uuid().nullable().optional(),
  type: z.nativeEnum(FollowupType),
  dueAt: z.string().datetime(),
  notes: z.string().max(1000).nullable().optional(),
});

export const UpdateFollowupSchema = z.object({
  assignedUserId: z.string().uuid().nullable().optional(),
  status: z.nativeEnum(FollowupStatus).optional(),
  notes: z.string().max(1000).nullable().optional(),
  completedAt: z.string().datetime().nullable().optional(),
});
