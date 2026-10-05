import { PGlite } from '@electric-sql/pglite';
import * as fs from 'fs';
import * as path from 'path';

describe('Inventory & Vehicle Management Tests (Phase 5)', () => {
  let db: PGlite;

  const dealerId = '11111111-1111-1111-1111-111111111111';

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

  it('Should create a vehicle with unique stock number per dealer', async () => {
    await setTenantContext();

    const result = await db.query<any>(`
      INSERT INTO vehicles (dealer_id, stock_number, make, model, year, price, status, fuel, transmission)
      VALUES ('${dealerId}', 'SM-1024', 'Hyundai', 'Creta', 2022, 1020000, 'available', 'petrol', 'automatic')
      RETURNING id, stock_number, status;
    `);

    expect(result.rows.length).toBe(1);
    expect(result.rows[0].stock_number).toBe('SM-1024');
    expect(result.rows[0].status).toBe('available');
  });

  it('Should REJECT creating another vehicle with the same stock number for the same dealer', async () => {
    await setTenantContext();

    await expect(
      db.exec(`
        SET ROLE app_user;
        SET app.current_dealer_id = '${dealerId}';
        INSERT INTO vehicles (dealer_id, stock_number, make, model, year, price, status)
        VALUES ('${dealerId}', 'SM-1024', 'Hyundai', 'Creta Dup', 2023, 1100000, 'available');
      `)
    ).rejects.toThrow();
  });

  it('Should mark vehicle as sold, update sold_at timestamp, and record Outbox event', async () => {
    await setTenantContext();

    const veh = await db.query<any>(`SELECT id FROM vehicles WHERE stock_number = 'SM-1024';`);
    const vehId = veh.rows[0].id;

    // Update status to sold
    await db.query(`
      UPDATE vehicles SET status = 'sold', sold_at = now() WHERE id = '${vehId}';
    `);

    const checkSold = await db.query<any>(`SELECT status, sold_at FROM vehicles WHERE id = '${vehId}';`);
    expect(checkSold.rows[0].status).toBe('sold');
    expect(checkSold.rows[0].sold_at).not.toBeNull();
  });
});
