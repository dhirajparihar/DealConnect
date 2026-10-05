import { PGlite } from '@electric-sql/pglite';
import * as fs from 'fs';
import * as path from 'path';

describe('Customer Onboarding & Identity Tests (AC02, AC03, AC04)', () => {
  let db: PGlite;

  const dealerAId = '11111111-1111-1111-1111-111111111111';
  const dealerBId = '22222222-2222-2222-2222-222222222222';
  const sharedPhone = '+919876543210';

  beforeAll(async () => {
    db = new PGlite();
    const schemaSqlPath = path.join(__dirname, '../../../prisma/schema.sql');
    const sqlContent = fs.readFileSync(schemaSqlPath, 'utf8');
    await db.exec(sqlContent);

    await db.exec(`
      CREATE ROLE app_user NOLOGIN;
      GRANT ALL ON ALL TABLES IN SCHEMA public TO app_user;

      SET app.is_platform_admin = 'true';
      INSERT INTO dealers (id, name, slug) VALUES ('${dealerAId}', 'Sharma Motors', 'sharma-motors');
      INSERT INTO dealers (id, name, slug) VALUES ('${dealerBId}', 'Verma Motors', 'verma-motors');
      SET app.is_platform_admin = 'false';
    `);
  });

  afterAll(async () => {
    await db.close();
  });

  const setTenantContext = async (dealerId: string) => {
    await db.exec(`
      SET ROLE app_user;
      SET app.current_dealer_id = '${dealerId}';
    `);
  };

  it('AC02: Should create a new customer for Dealer A on first OTP verification', async () => {
    await setTenantContext(dealerAId);
    
    // Simulate customer lookup & creation logic
    const existing = await db.query<any>(`SELECT * FROM customers WHERE dealer_id = '${dealerAId}' AND normalized_phone = '${sharedPhone}';`);
    expect(existing.rows.length).toBe(0);

    const inserted = await db.query<any>(`
      INSERT INTO customers (dealer_id, name, normalized_phone) 
      VALUES ('${dealerAId}', 'Rahul Sharma', '${sharedPhone}') 
      RETURNING id, name, normalized_phone;
    `);

    expect(inserted.rows.length).toBe(1);
    expect(inserted.rows[0].name).toBe('Rahul Sharma');
    expect(inserted.rows[0].normalized_phone).toBe(sharedPhone);
  });

  it('AC03: Should NOT create a duplicate customer if the same phone verifies again for Dealer A', async () => {
    await setTenantContext(dealerAId);

    // Lookup existing customer
    const existing = await db.query<any>(`SELECT * FROM customers WHERE dealer_id = '${dealerAId}' AND normalized_phone = '${sharedPhone}';`);
    expect(existing.rows.length).toBe(1);
    const existingId = existing.rows[0].id;

    // Verify duplicate creation throws unique constraint error
    await expect(
      db.query(`INSERT INTO customers (dealer_id, name, normalized_phone) VALUES ('${dealerAId}', 'Rahul Dup', '${sharedPhone}');`)
    ).rejects.toThrow();

    // Verify customer count remains 1 for Dealer A
    const count = await db.query<any>(`SELECT COUNT(*)::int as total FROM customers WHERE dealer_id = '${dealerAId}';`);
    expect(count.rows[0].total).toBe(1);
  });

  it('AC04: Same phone registered with Dealer B should create an independent Customer B record', async () => {
    await setTenantContext(dealerBId);

    const insertedB = await db.query<any>(`
      INSERT INTO customers (dealer_id, name, normalized_phone) 
      VALUES ('${dealerBId}', 'Rahul Verma', '${sharedPhone}') 
      RETURNING id, name, normalized_phone, dealer_id;
    `);

    expect(insertedB.rows.length).toBe(1);
    expect(insertedB.rows[0].name).toBe('Rahul Verma');
    expect(insertedB.rows[0].dealer_id).toBe(dealerBId);

    // Verify Dealer A still sees only 1 customer (Rahul Sharma)
    await setTenantContext(dealerAId);
    const dealerACustomers = await db.query<any>(`SELECT * FROM customers;`);
    expect(dealerACustomers.rows.length).toBe(1);
    expect(dealerACustomers.rows[0].name).toBe('Rahul Sharma');
  });
});
