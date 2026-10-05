import { PGlite } from '@electric-sql/pglite';
import * as fs from 'fs';
import * as path from 'path';

describe('PostgreSQL Row-Level Security (RLS) Tenant Isolation', () => {
  let db: PGlite;

  beforeAll(async () => {
    db = new PGlite();
    const schemaSqlPath = path.join(__dirname, '../../prisma/schema.sql');
    const sqlContent = fs.readFileSync(schemaSqlPath, 'utf8');
    await db.exec(sqlContent);

    // Create standard non-superuser application role for testing RLS
    await db.exec(`
      CREATE ROLE app_user NOLOGIN;
      GRANT ALL ON ALL TABLES IN SCHEMA public TO app_user;
    `);
  });

  afterAll(async () => {
    await db.close();
  });

  it('should isolate customer records between Dealer A and Dealer B under RLS', async () => {
    const dealerAId = '11111111-1111-1111-1111-111111111111';
    const dealerBId = '22222222-2222-2222-2222-222222222222';

    // Insert Dealers as platform admin / superuser
    await db.exec(`
      RESET ROLE;
      SET app.is_platform_admin = 'true';
      INSERT INTO dealers (id, name, slug) VALUES ('${dealerAId}', 'Dealer A', 'dealer-a');
      INSERT INTO dealers (id, name, slug) VALUES ('${dealerBId}', 'Dealer B', 'dealer-b');
      
      INSERT INTO customers (dealer_id, name, normalized_phone) VALUES ('${dealerAId}', 'Customer A', '+919999911111');
      INSERT INTO customers (dealer_id, name, normalized_phone) VALUES ('${dealerBId}', 'Customer B', '+919999922222');
      SET app.is_platform_admin = 'false';
    `);

    // Helper to set app_user role and context
    const setTenantContext = async (dealerId: string) => {
      await db.exec(`
        SET ROLE app_user;
        SET app.current_dealer_id = '${dealerId}';
      `);
    };

    // 1. Query as Dealer A context
    await setTenantContext(dealerAId);
    const selectA = await db.query<any>('SELECT * FROM customers;');
    expect(selectA.rows.length).toBe(1);
    expect(selectA.rows[0].name).toBe('Customer A');
    expect(selectA.rows[0].dealer_id).toBe(dealerAId);

    // 2. Query as Dealer B context
    await setTenantContext(dealerBId);
    const selectB = await db.query<any>('SELECT * FROM customers;');
    expect(selectB.rows.length).toBe(1);
    expect(selectB.rows[0].name).toBe('Customer B');
    expect(selectB.rows[0].dealer_id).toBe(dealerBId);

    // 3. Attempt Dealer A mutating Dealer B row
    await setTenantContext(dealerAId);
    const updateResult = await db.query(`UPDATE customers SET name = 'Hacked' WHERE dealer_id = '${dealerBId}';`);
    expect(updateResult.affectedRows).toBe(0);

    // Verify Customer B remains unchanged
    await setTenantContext(dealerBId);
    const checkCustB = await db.query<any>('SELECT * FROM customers;');
    expect(checkCustB.rows[0].name).toBe('Customer B');
  });

  it('should enforce unique constraint (dealer_id, normalized_phone) allowing same phone for different dealers', async () => {
    const dealerAId = '11111111-1111-1111-1111-111111111111';
    const dealerBId = '22222222-2222-2222-2222-222222222222';
    const sharedPhone = '+919876543210';

    await db.exec(`
      RESET ROLE;
      SET app.is_platform_admin = 'true';
      INSERT INTO customers (dealer_id, name, normalized_phone) VALUES ('${dealerAId}', 'Rahul A', '${sharedPhone}');
      INSERT INTO customers (dealer_id, name, normalized_phone) VALUES ('${dealerBId}', 'Rahul B', '${sharedPhone}');
      SET app.is_platform_admin = 'false';
    `);

    // Insert DUPLICATE phone for Dealer A -> MUST FAIL
    await expect(
      db.exec(`
        RESET ROLE;
        SET app.is_platform_admin = 'true';
        INSERT INTO customers (dealer_id, name, normalized_phone) VALUES ('${dealerAId}', 'Rahul A Dup', '${sharedPhone}');
      `)
    ).rejects.toThrow();
  });
});
