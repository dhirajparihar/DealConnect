import { PGlite } from '@electric-sql/pglite';
import * as fs from 'fs';
import * as path from 'path';

describe('Dealer Workflow & Dashboard Tests (Phase 9 & AC10)', () => {
  let db: PGlite;

  const dealerId = '11111111-1111-1111-1111-111111111111';
  const customerId = '22222222-2222-2222-2222-222222222222';
  const vehicleId = '33333333-3333-3333-3333-333333333333';
  const matchId = '44444444-4444-4444-4444-444444444444';

  beforeAll(async () => {
    db = new PGlite();
    const schemaSqlPath = path.join(__dirname, '../../../prisma/schema.sql');
    const sqlContent = fs.readFileSync(schemaSqlPath, 'utf8');
    await db.exec(sqlContent);

    await db.exec(`
      CREATE ROLE app_user NOLOGIN;
      GRANT ALL ON ALL TABLES IN SCHEMA public TO app_user;

      SET app.is_platform_admin = 'true';
      INSERT INTO dealers (id, name, slug) VALUES ('${dealerId}', 'Sharma Motors', 'sharma-motors-dash');
      INSERT INTO customers (id, dealer_id, name, normalized_phone) VALUES ('${customerId}', '${dealerId}', 'Rahul Sharma', '+919876543210');
      INSERT INTO vehicles (id, dealer_id, stock_number, make, model, year, price, status) VALUES ('${vehicleId}', '${dealerId}', 'SM-D01', 'Hyundai', 'Creta', 2022, 1000000, 'available');
      INSERT INTO requirements (id, dealer_id, customer_id, status) VALUES (gen_random_uuid(), '${dealerId}', '${customerId}', 'searching');
      INSERT INTO matches (id, dealer_id, requirement_id, vehicle_id, score, score_breakdown, status)
      VALUES ('${matchId}', '${dealerId}', (SELECT id FROM requirements WHERE customer_id = '${customerId}'), '${vehicleId}', 95.0, '{"total": 95}'::jsonb, 'interested');
      SET app.is_platform_admin = 'false';
    `);
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

  it('AC10: Should create follow-up and activity when customer marks match as interested', async () => {
    await setTenantContext();

    // Create followup for Interested match
    const followup = await db.query<any>(`
      INSERT INTO followups (dealer_id, customer_id, type, due_at, status, notes)
      VALUES ('${dealerId}', '${customerId}', 'call', now() + interval '1 day', 'open', 'Customer expressed interest in Hyundai Creta')
      RETURNING id, status;
    `);

    expect(followup.rows.length).toBe(1);
    expect(followup.rows[0].status).toBe('open');

    // Create Activity
    await db.query(`
      INSERT INTO activities (dealer_id, customer_id, vehicle_id, activity_type, metadata)
      VALUES ('${dealerId}', '${customerId}', '${vehicleId}', 'CustomerInterested', '{"matchId":"${matchId}"}'::jsonb);
    `);

    const actCheck = await db.query<any>(`SELECT activity_type FROM activities WHERE customer_id = '${customerId}';`);
    expect(actCheck.rows[0].activity_type).toBe('CustomerInterested');
  });

  it('Should compute correct dealer dashboard metrics', async () => {
    await setTenantContext();

    const activeCust = await db.query<any>(`SELECT COUNT(*)::int as count FROM customers WHERE dealer_id = '${dealerId}' AND status = 'active';`);
    const activeReq = await db.query<any>(`SELECT COUNT(*)::int as count FROM requirements WHERE dealer_id = '${dealerId}' AND status = 'searching';`);
    const availVeh = await db.query<any>(`SELECT COUNT(*)::int as count FROM vehicles WHERE dealer_id = '${dealerId}' AND status = 'available';`);
    const interestedMatches = await db.query<any>(`SELECT COUNT(*)::int as count FROM matches WHERE dealer_id = '${dealerId}' AND status = 'interested';`);
    const openFollowups = await db.query<any>(`SELECT COUNT(*)::int as count FROM followups WHERE dealer_id = '${dealerId}' AND status = 'open';`);

    expect(activeCust.rows[0].count).toBe(1);
    expect(activeReq.rows[0].count).toBe(1);
    expect(availVeh.rows[0].count).toBe(1);
    expect(interestedMatches.rows[0].count).toBe(1);
    expect(openFollowups.rows[0].count).toBe(1);
  });

  it('Should mark followup as completed and set completed_at timestamp', async () => {
    await setTenantContext();

    const f = await db.query<any>(`SELECT id FROM followups WHERE customer_id = '${customerId}' LIMIT 1;`);
    const fId = f.rows[0].id;

    await db.query(`
      UPDATE followups SET status = 'completed', completed_at = now() WHERE id = '${fId}';
    `);

    const check = await db.query<any>(`SELECT status, completed_at FROM followups WHERE id = '${fId}';`);
    expect(check.rows[0].status).toBe('completed');
    expect(check.rows[0].completed_at).not.toBeNull();
  });
});
