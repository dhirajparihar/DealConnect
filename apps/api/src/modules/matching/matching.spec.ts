import { PGlite } from '@electric-sql/pglite';
import * as fs from 'fs';
import * as path from 'path';
import { MatchingService, RequirementMatchInput, VehicleMatchInput } from './matching.service.js';

describe('Matching Engine Tests (AC06, AC07, 100-Point Scoring Algorithm)', () => {
  let db: PGlite;
  let matchingService: MatchingService;

  const dealerAId = '11111111-1111-1111-1111-111111111111';
  const dealerBId = '22222222-2222-2222-2222-222222222222';

  beforeAll(async () => {
    db = new PGlite();
    const schemaSqlPath = path.join(__dirname, '../../../prisma/schema.sql');
    const sqlContent = fs.readFileSync(schemaSqlPath, 'utf8');
    await db.exec(sqlContent);
    matchingService = new MatchingService(null as any);
  });

  afterAll(async () => {
    await db.close();
  });

  describe('Deterministic 100-Point Scoring Unit Tests', () => {
    it('Should calculate 100 points for a perfect match', () => {
      const vehicle: VehicleMatchInput = {
        id: 'veh-101',
        dealerId: dealerAId,
        make: 'Hyundai',
        model: 'Creta',
        year: 2022,
        price: 1000000,
        fuel: 'petrol',
        transmission: 'automatic',
        kilometers: 30000,
        status: 'available',
      };

      const req: RequirementMatchInput = {
        id: 'req-101',
        dealerId: dealerAId,
        customerId: 'cust-101',
        status: 'searching',
        preferences: {
          make: 'Hyundai',
          model: 'Creta',
          minYear: 2021,
          maxYear: 2024,
          minPrice: 900000,
          maxPrice: 1100000,
          fuel: 'petrol',
          transmission: 'automatic',
          maxKm: 50000,
        },
      };

      const result = matchingService.calculateScore(req, vehicle);
      expect(result.isEligible).toBe(true);
      expect(result.score).toBe(100);
      expect(result.breakdown.make_model).toBe(30);
      expect(result.breakdown.budget).toBe(25);
      expect(result.breakdown.year).toBe(15);
      expect(result.breakdown.fuel).toBe(10);
      expect(result.breakdown.transmission).toBe(10);
      expect(result.breakdown.kilometers).toBe(5);
      expect(result.breakdown.location).toBe(5);
    });

    it('AC07: Should REJECT cross-dealer matching (Dealer A vehicle vs Dealer B requirement)', () => {
      const vehicleA: VehicleMatchInput = {
        id: 'veh-A',
        dealerId: dealerAId,
        make: 'Hyundai',
        model: 'Creta',
        year: 2022,
        price: 1000000,
        status: 'available',
      };

      const reqB: RequirementMatchInput = {
        id: 'req-B',
        dealerId: dealerBId,
        customerId: 'cust-B',
        status: 'searching',
        preferences: { make: 'Hyundai', model: 'Creta' },
      };

      const result = matchingService.calculateScore(reqB, vehicleA);
      expect(result.isEligible).toBe(false);
      expect(result.score).toBe(0);
    });

    it('Should REJECT matching if vehicle status is NOT available', () => {
      const vehicle: VehicleMatchInput = {
        id: 'veh-sold',
        dealerId: dealerAId,
        make: 'Hyundai',
        model: 'Creta',
        year: 2022,
        price: 1000000,
        status: 'sold',
      };

      const req: RequirementMatchInput = {
        id: 'req-1',
        dealerId: dealerAId,
        customerId: 'cust-1',
        status: 'searching',
        preferences: { make: 'Hyundai', model: 'Creta' },
      };

      const result = matchingService.calculateScore(req, vehicle);
      expect(result.isEligible).toBe(false);
    });

    it('Should REJECT matching if requirement status is closed or paused', () => {
      const vehicle: VehicleMatchInput = {
        id: 'veh-1',
        dealerId: dealerAId,
        make: 'Hyundai',
        model: 'Creta',
        year: 2022,
        price: 1000000,
        status: 'available',
      };

      const reqClosed: RequirementMatchInput = {
        id: 'req-closed',
        dealerId: dealerAId,
        customerId: 'cust-1',
        status: 'closed',
        preferences: { make: 'Hyundai', model: 'Creta' },
      };

      const result = matchingService.calculateScore(reqClosed, vehicle);
      expect(result.isEligible).toBe(false);
    });

    it('Should REJECT fuel or transmission hard mismatch', () => {
      const vehicle: VehicleMatchInput = {
        id: 'veh-1',
        dealerId: dealerAId,
        make: 'Hyundai',
        model: 'Creta',
        year: 2022,
        price: 1000000,
        fuel: 'petrol',
        transmission: 'manual',
        status: 'available',
      };

      const reqDiesel: RequirementMatchInput = {
        id: 'req-1',
        dealerId: dealerAId,
        customerId: 'cust-1',
        status: 'searching',
        preferences: { make: 'Hyundai', model: 'Creta', fuel: 'diesel' },
      };

      const result = matchingService.calculateScore(reqDiesel, vehicle);
      expect(result.isEligible).toBe(false);
    });
  });

  describe('Database Match Deduplication Integration Tests', () => {
    it('Should insert match record and enforce UNIQUE(requirement_id, vehicle_id)', async () => {
      const custId = '33333333-3333-3333-3333-333333333333';
      const vehId = '44444444-4444-4444-4444-444444444444';
      const reqId = '55555555-5555-5555-5555-555555555555';

      await db.exec(`
        CREATE ROLE app_user NOLOGIN;
        GRANT ALL ON ALL TABLES IN SCHEMA public TO app_user;

        SET app.is_platform_admin = 'true';
        INSERT INTO dealers (id, name, slug) VALUES ('${dealerAId}', 'Sharma Motors', 'sharma-motors-match');
        INSERT INTO customers (id, dealer_id, name, normalized_phone) VALUES ('${custId}', '${dealerAId}', 'Rahul', '+919999988888');
        INSERT INTO vehicles (id, dealer_id, stock_number, make, model, year, price, status) VALUES ('${vehId}', '${dealerAId}', 'SM-M01', 'Hyundai', 'Creta', 2022, 1000000, 'available');
        INSERT INTO requirements (id, dealer_id, customer_id, status) VALUES ('${reqId}', '${dealerAId}', '${custId}', 'searching');
        SET app.is_platform_admin = 'false';
      `);

      await db.exec(`
        SET ROLE app_user;
        SET app.current_dealer_id = '${dealerAId}';
      `);

      // First match insertion
      const m1 = await db.query<any>(`
        INSERT INTO matches (dealer_id, requirement_id, vehicle_id, score, score_breakdown, status)
        VALUES ('${dealerAId}', '${reqId}', '${vehId}', 95.0, '{"total": 95}'::jsonb, 'new')
        RETURNING id;
      `);
      expect(m1.rows.length).toBe(1);

      // Attempt duplicate insertion on same (requirement_id, vehicle_id) -> MUST FAIL
      await expect(
        db.exec(`
          SET ROLE app_user;
          SET app.current_dealer_id = '${dealerAId}';
          INSERT INTO matches (dealer_id, requirement_id, vehicle_id, score, score_breakdown, status)
          VALUES ('${dealerAId}', '${reqId}', '${vehId}', 95.0, '{"total": 95}'::jsonb, 'new');
        `)
      ).rejects.toThrow();
    });
  });
});
