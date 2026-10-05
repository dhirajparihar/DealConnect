import { PGlite } from '@electric-sql/pglite';
import * as fs from 'fs';
import * as path from 'path';

describe('Cross-Tenant Security & Access Control Tests (AC13 & AC04)', () => {
  let db: PGlite;

  const dealerAId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const dealerBId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

  let customerAId: string;
  let customerBId: string;
  let vehicleAId: string;
  let vehicleBId: string;
  let reqAId: string;
  let reqBId: string;

  beforeAll(async () => {
    db = new PGlite();
    const schemaSqlPath = path.join(__dirname, '../../../prisma/schema.sql');
    const sqlContent = fs.readFileSync(schemaSqlPath, 'utf8');
    await db.exec(sqlContent);

    await db.exec(`
      CREATE ROLE app_user NOLOGIN;
      GRANT ALL ON ALL TABLES IN SCHEMA public TO app_user;
    `);

    // Seed Dealer A & Dealer B data as superuser
    await db.exec(`
      RESET ROLE;
      SET app.is_platform_admin = 'true';
      
      INSERT INTO dealers (id, name, slug) VALUES ('${dealerAId}', 'Sharma Motors', 'sharma-motors');
      INSERT INTO dealers (id, name, slug) VALUES ('${dealerBId}', 'Verma Cars', 'verma-cars');
      
      -- Customers
      INSERT INTO customers (id, dealer_id, name, normalized_phone) VALUES (gen_random_uuid(), '${dealerAId}', 'Rahul A', '+919876543210') RETURNING id;
      INSERT INTO customers (id, dealer_id, name, normalized_phone) VALUES (gen_random_uuid(), '${dealerBId}', 'Rahul B', '+919876543210') RETURNING id;
      
      -- Vehicles
      INSERT INTO vehicles (id, dealer_id, stock_number, make, model, year, price, status) VALUES (gen_random_uuid(), '${dealerAId}', 'SM-101', 'Hyundai', 'Creta', 2022, 1000000, 'available');
      INSERT INTO vehicles (id, dealer_id, stock_number, make, model, year, price, status) VALUES (gen_random_uuid(), '${dealerBId}', 'VC-201', 'Toyota', 'Fortuner', 2021, 2800000, 'available');
      
      SET app.is_platform_admin = 'false';
    `);

    const custA = await db.query<any>(`SELECT id FROM customers WHERE dealer_id = '${dealerAId}';`);
    customerAId = custA.rows[0].id;
    const custB = await db.query<any>(`SELECT id FROM customers WHERE dealer_id = '${dealerBId}';`);
    customerBId = custB.rows[0].id;

    const vehA = await db.query<any>(`SELECT id FROM vehicles WHERE dealer_id = '${dealerAId}';`);
    vehicleAId = vehA.rows[0].id;
    const vehB = await db.query<any>(`SELECT id FROM vehicles WHERE dealer_id = '${dealerBId}';`);
    vehicleBId = vehB.rows[0].id;

    // Requirements
    await db.exec(`
      RESET ROLE;
      SET app.is_platform_admin = 'true';
      INSERT INTO requirements (id, dealer_id, customer_id, status) VALUES (gen_random_uuid(), '${dealerAId}', '${customerAId}', 'searching');
      INSERT INTO requirements (id, dealer_id, customer_id, status) VALUES (gen_random_uuid(), '${dealerBId}', '${customerBId}', 'searching');
      SET app.is_platform_admin = 'false';
    `);

    const reqA = await db.query<any>(`SELECT id FROM requirements WHERE dealer_id = '${dealerAId}';`);
    reqAId = reqA.rows[0].id;
    const reqB = await db.query<any>(`SELECT id FROM requirements WHERE dealer_id = '${dealerBId}';`);
    reqBId = reqB.rows[0].id;
  });

  afterAll(async () => {
    await db.close();
  });

  const setDealerContext = async (dealerId: string) => {
    await db.exec(`
      SET ROLE app_user;
      SET app.current_dealer_id = '${dealerId}';
    `);
  };

  it('Dealer A should NOT be able to READ Dealer B customers', async () => {
    await setDealerContext(dealerAId);
    const result = await db.query<any>(`SELECT * FROM customers WHERE id = '${customerBId}';`);
    expect(result.rows.length).toBe(0);
  });

  it('Dealer A should NOT be able to UPDATE Dealer B customers', async () => {
    await setDealerContext(dealerAId);
    const result = await db.query<any>(`UPDATE customers SET name = 'Hacked Name' WHERE id = '${customerBId}';`);
    expect(result.affectedRows).toBe(0);

    // Verify Dealer B customer unchanged
    await setDealerContext(dealerBId);
    const checkCustB = await db.query<any>(`SELECT name FROM customers WHERE id = '${customerBId}';`);
    expect(checkCustB.rows[0].name).toBe('Rahul B');
  });

  it('Dealer A should NOT be able to DELETE Dealer B vehicles', async () => {
    await setDealerContext(dealerAId);
    const result = await db.query<any>(`DELETE FROM vehicles WHERE id = '${vehicleBId}';`);
    expect(result.affectedRows).toBe(0);

    // Verify Dealer B vehicle still exists
    await setDealerContext(dealerBId);
    const checkVehB = await db.query<any>(`SELECT * FROM vehicles WHERE id = '${vehicleBId}';`);
    expect(checkVehB.rows.length).toBe(1);
  });

  it('Dealer A search should NEVER return Dealer B records', async () => {
    await setDealerContext(dealerAId);
    const result = await db.query<any>(`SELECT * FROM vehicles WHERE make = 'Toyota';`);
    expect(result.rows.length).toBe(0);
  });

  it('Dealer A requirement query should NEVER expose Dealer B requirements', async () => {
    await setDealerContext(dealerAId);
    const result = await db.query<any>(`SELECT * FROM requirements WHERE id = '${reqBId}';`);
    expect(result.rows.length).toBe(0);
  });
});
