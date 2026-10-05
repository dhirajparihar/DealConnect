import { normalizePhoneNumber, PhoneSchema, CreateVehicleSchema, CreateRequirementSchema } from './index.js';

describe('Validation Package', () => {
  describe('normalizePhoneNumber', () => {
    it('should format 10-digit Indian numbers with +91', () => {
      expect(normalizePhoneNumber('9876543210')).toBe('+919876543210');
    });

    it('should handle numbers with spaces or dashes', () => {
      expect(normalizePhoneNumber('+91 98765-43210')).toBe('+919876543210');
    });

    it('should preserve valid E.164 numbers', () => {
      expect(normalizePhoneNumber('+14155552671')).toBe('+14155552671');
    });
  });

  describe('PhoneSchema', () => {
    it('should validate and normalize valid phone numbers', () => {
      const result = PhoneSchema.safeParse('9876543210');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('+919876543210');
      }
    });

    it('should reject invalid phone numbers', () => {
      const result = PhoneSchema.safeParse('123');
      expect(result.success).toBe(false);
    });
  });

  describe('CreateVehicleSchema', () => {
    it('should validate correct vehicle input', () => {
      const vehicle = {
        stockNumber: 'SM-1001',
        make: 'Hyundai',
        model: 'Creta',
        year: 2022,
        price: 1050000,
        fuel: 'petrol',
        transmission: 'automatic',
        kilometers: 25000,
      };
      const result = CreateVehicleSchema.safeParse(vehicle);
      expect(result.success).toBe(true);
    });

    it('should fail when required fields are missing', () => {
      const vehicle = {
        make: 'Hyundai',
      };
      const result = CreateVehicleSchema.safeParse(vehicle);
      expect(result.success).toBe(false);
    });
  });

  describe('CreateRequirementSchema', () => {
    it('should validate correct requirement input', () => {
      const req = {
        make: 'Toyota',
        model: 'Fortuner',
        minPrice: 2000000,
        maxPrice: 3500000,
        minYear: 2020,
        maxYear: 2024,
      };
      const result = CreateRequirementSchema.safeParse(req);
      expect(result.success).toBe(true);
    });
  });
});
