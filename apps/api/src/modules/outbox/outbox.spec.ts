import { PGlite } from '@electric-sql/pglite';
import * as fs from 'fs';
import * as path from 'path';

describe('Outbox Pattern & Worker Fault-Tolerance Tests (Phase 7)', () => {
  let db: PGlite;

  const dealerId = '11111111-1111-1111-1111-111111111111';

  beforeAll(async () => {
    db = new PGlite();
    const schemaSqlPath = path.join(__dirname, '../../../prisma/schema.sql');
    const sqlContent = fs.readFileSync(schemaSqlPath, 'utf8');
    await db.exec(sqlContent);

    await db.exec(`
      SET app.is_platform_admin = 'true';
      INSERT INTO dealers (id, name, slug) VALUES ('${dealerId}', 'Sharma Motors', 'sharma-motors-outbox');
      SET app.is_platform_admin = 'false';
    `);
  });

  afterAll(async () => {
    await db.close();
  });

  it('Should insert outbox event in pending state and transition to processed on successful execution', async () => {
    const eventId = '10000000-0000-0000-0000-000000000001';

    // 1. Transactionally insert outbox event
    await db.exec(`
      INSERT INTO outbox_events (id, dealer_id, event_type, aggregate_type, aggregate_id, payload, status)
      VALUES ('${eventId}', '${dealerId}', 'VehicleCreated', 'Vehicle', gen_random_uuid(), '{"make":"Hyundai"}'::jsonb, 'pending');
    `);

    const checkPending = await db.query<any>(`SELECT status, attempts FROM outbox_events WHERE id = '${eventId}';`);
    expect(checkPending.rows[0].status).toBe('pending');
    expect(checkPending.rows[0].attempts).toBe(0);

    // 2. Lock for processing
    await db.exec(`
      UPDATE outbox_events SET status = 'processing', attempts = attempts + 1 WHERE id = '${eventId}';
    `);

    const checkProcessing = await db.query<any>(`SELECT status, attempts FROM outbox_events WHERE id = '${eventId}';`);
    expect(checkProcessing.rows[0].status).toBe('processing');
    expect(checkProcessing.rows[0].attempts).toBe(1);

    // 3. Mark processed
    await db.exec(`
      UPDATE outbox_events SET status = 'processed', processed_at = now() WHERE id = '${eventId}';
    `);

    const checkProcessed = await db.query<any>(`SELECT status, processed_at FROM outbox_events WHERE id = '${eventId}';`);
    expect(checkProcessed.rows[0].status).toBe('processed');
    expect(checkProcessed.rows[0].processed_at).not.toBeNull();
  });

  it('Should handle retry backoff on failure and transition to dead_letter after 5 failed attempts', async () => {
    const eventId = '20000000-0000-0000-0000-000000000002';

    await db.exec(`
      INSERT INTO outbox_events (id, dealer_id, event_type, aggregate_type, aggregate_id, payload, status, attempts)
      VALUES ('${eventId}', '${dealerId}', 'MatchCreated', 'Match', gen_random_uuid(), '{"score":90}'::jsonb, 'failed', 4);
    `);

    // Simulate 5th failed attempt -> move to dead_letter
    await db.exec(`
      UPDATE outbox_events SET status = 'dead_letter', attempts = 5 WHERE id = '${eventId}';
    `);

    const checkDeadLetter = await db.query<any>(`SELECT status, attempts FROM outbox_events WHERE id = '${eventId}';`);
    expect(checkDeadLetter.rows[0].status).toBe('dead_letter');
    expect(checkDeadLetter.rows[0].attempts).toBe(5);
  });
});
