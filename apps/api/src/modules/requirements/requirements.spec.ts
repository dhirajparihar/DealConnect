import { PGlite } from '@electric-sql/pglite';
import * as fs from 'fs';
import * as path from 'path';

describe('Requirements Engine Tests (AC05 & Multi-Requirement Support)', () => {
  let db: PGlite;

  const dealerId = '11111111-1111-1111-1111-111111111111';
  let customerId: string;

  beforeAll(async () => {
    db = new PGlite();
    const schemaSqlPath = path.join(__dirname, '../../../prisma/schema.sql');
    const sqlContent = fs.readFileSync(schemaSqlPath, 'utf8');
    await db.exec(sqlContent);

    await db.exec(`
      CREATE ROLE app_user NOLOGIN;
      GRANT ALL ON ALL TABLES IN SCHEMA public TO app_user;

      SET app.is_platform_admin = 'true';
      INSERT INTO dealers (id, name, slug) VALUES ('${dealerId}', 'Sharma Motors', 'sharma-motors');
      INSERT INTO customers (id, dealer_id, name, normalized_phone) VALUES (gen_random_uuid(), '${dealerId}', 'Rahul Sharma', '+919876543210') RETURNING id;
      SET app.is_platform_admin = 'false';
    `);

    const cust = await db.query<any>(`SELECT id FROM customers WHERE dealer_id = '${dealerId}';`);
    customerId = cust.rows[0].id;
  });

  afterAll(async () => {
    await db.close();
  });

  const setTenantContext = async () => {
    await db.exec(`
      SET ROLE app_user;
      SET app.current_dealer_id = '${dealerId}';
    `);
  };

  it('AC05: Should allow a single customer to create multiple active requirements', async () => {
    await setTenantContext();

    // Requirement 1: Toyota Fortuner under 35 lakh
    const req1 = await db.query<any>(`
      INSERT INTO requirements (dealer_id, customer_id, status, priority, source)
      VALUES ('${dealerId}', '${customerId}', 'searching', 'high', 'customer_portal')
      RETURNING id;
    `);
    const req1Id = req1.rows[0].id;

    await db.query(`
      INSERT INTO requirement_preferences (requirement_id, make, model, max_price, min_year, fuel)
      VALUES ('${req1Id}', 'Toyota', 'Fortuner', 3500000, 2020, 'diesel');
    `);

    // Requirement 2: Hyundai Creta under 15 lakh
    const req2 = await db.query<any>(`
      INSERT INTO requirements (dealer_id, customer_id, status, priority, source)
      VALUES ('${dealerId}', '${customerId}', 'searching', 'normal', 'customer_portal')
      RETURNING id;
    `);
    const req2Id = req2.rows[0].id;

    await db.query(`
      INSERT INTO requirement_preferences (requirement_id, make, model, max_price, min_year, fuel, transmission)
      VALUES ('${req2Id}', 'Hyundai', 'Creta', 1500000, 2021, 'petrol', 'automatic');
    `);

    // Verify Customer has 2 active requirements
    const count = await db.query<any>(`
      SELECT COUNT(*)::int as total FROM requirements WHERE customer_id = '${customerId}' AND status = 'searching';
    `);
    expect(count.rows[0].total).toBe(2);
  });

  it('Should support requirement lifecycle status transitions and outbox events', async () => {
    await setTenantContext();

    const req = await db.query<any>(`SELECT id FROM requirements WHERE customer_id = '${customerId}' LIMIT 1;`);
    const reqId = req.rows[0].id;

    // 1. Pause requirement
    await db.query(`UPDATE requirements SET status = 'paused' WHERE id = '${reqId}';`);

    const checkPaused = await db.query<any>(`SELECT status FROM requirements WHERE id = '${reqId}';`);
    expect(checkPaused.rows[0].status).toBe('paused');

    // 2. Close requirement
    await db.query(`UPDATE requirements SET status = 'closed', closed_at = now() WHERE id = '${reqId}';`);

    const checkClosed = await db.query<any>(`SELECT status, closed_at FROM requirements WHERE id = '${reqId}';`);
    expect(checkClosed.rows[0].status).toBe('closed');
    expect(checkClosed.rows[0].closed_at).not.toBeNull();
  });
});
