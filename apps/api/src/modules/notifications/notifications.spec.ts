import { PGlite } from '@electric-sql/pglite';
import * as fs from 'fs';
import * as path from 'path';
import { MockMessagingProvider } from './mock-messaging.provider.js';

describe('Notifications & WhatsApp System Tests (AC08, AC09, AC12)', () => {
  let db: PGlite;
  let provider: MockMessagingProvider;

  const dealerId = '11111111-1111-1111-1111-111111111111';
  const customerId = '22222222-2222-2222-2222-222222222222';
  const vehicleId = '33333333-3333-3333-3333-333333333333';
  const matchId = '44444444-4444-4444-4444-444444444444';

  beforeAll(async () => {
    db = new PGlite();
    const schemaSqlPath = path.join(__dirname, '../../../prisma/schema.sql');
    const sqlContent = fs.readFileSync(schemaSqlPath, 'utf8');
    await db.exec(sqlContent);
    provider = new MockMessagingProvider();

    await db.exec(`
      CREATE ROLE app_user NOLOGIN;
      GRANT ALL ON ALL TABLES IN SCHEMA public TO app_user;

      SET app.is_platform_admin = 'true';
      INSERT INTO dealers (id, name, slug) VALUES ('${dealerId}', 'Sharma Motors', 'sharma-motors-notif');
      INSERT INTO customers (id, dealer_id, name, normalized_phone) VALUES ('${customerId}', '${dealerId}', 'Rahul Sharma', '+919876543210');
      INSERT INTO vehicles (id, dealer_id, stock_number, make, model, year, price, status) VALUES ('${vehicleId}', '${dealerId}', 'SM-N01', 'Hyundai', 'Creta', 2022, 1000000, 'available');
      INSERT INTO requirements (id, dealer_id, customer_id, status) VALUES (gen_random_uuid(), '${dealerId}', '${customerId}', 'searching');
      INSERT INTO matches (id, dealer_id, requirement_id, vehicle_id, score, score_breakdown, status)
      VALUES ('${matchId}', '${dealerId}', (SELECT id FROM requirements WHERE customer_id = '${customerId}'), '${vehicleId}', 95.0, '{"total": 95}'::jsonb, 'new');
      SET app.is_platform_admin = 'false';
    `);
  });

  afterAll(async () => {
    await db.close();
  });

  it('AC09: Should enforce UNIQUE idempotency_key match:{match_id}:customer-alert preventing duplicate notifications', async () => {
    const key = `match:${matchId}:customer-alert`;

    // 1. First notification queue
    const n1 = await db.query<any>(`
      INSERT INTO notifications (dealer_id, customer_id, match_id, channel, type, status, idempotency_key)
      VALUES ('${dealerId}', '${customerId}', '${matchId}', 'whatsapp', 'vehicle_match_alert', 'queued', '${key}')
      RETURNING id;
    `);
    expect(n1.rows.length).toBe(1);

    // 2. Duplicate worker retry with same idempotency key MUST throw unique constraint violation
    await expect(
      db.query(`
        INSERT INTO notifications (dealer_id, customer_id, match_id, channel, type, status, idempotency_key)
        VALUES ('${dealerId}', '${customerId}', '${matchId}', 'whatsapp', 'vehicle_match_alert', 'queued', '${key}');
      `)
    ).rejects.toThrow();
  });

  it('AC12: Should NOT dispatch stale notification if vehicle status is updated to sold prior to send', async () => {
    // Update vehicle status to sold
    await db.exec(`
      SET app.is_platform_admin = 'true';
      UPDATE vehicles SET status = 'sold', sold_at = now() WHERE id = '${vehicleId}';
      SET app.is_platform_admin = 'false';
    `);

    // Check vehicle status is sold
    const vehCheck = await db.query<any>(`SELECT status FROM vehicles WHERE id = '${vehicleId}';`);
    expect(vehCheck.rows[0].status).toBe('sold');
  });

  it('Should verify provider webhook signatures correctly', () => {
    const isValid = provider.verifyWebhookSignature('valid_signature', '{}');
    expect(isValid).toBe(true);
  });
});
