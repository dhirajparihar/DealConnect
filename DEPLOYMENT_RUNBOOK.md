# DealConnect Deployment Runbook

## 1. Prerequisites
- **Node.js**: v18+
- **PostgreSQL**: v14+ (or managed service like AWS RDS, Supabase)
- **Redis**: v6+ (or managed service like Upstash, AWS ElastiCache)
- **PM2**: `npm install -g pm2` (for process management)
- **Nginx / Caddy**: For reverse proxy and SSL termination.

## 2. Infrastructure Setup
1. **Database**: 
   - Provision a PostgreSQL database.
   - Run migrations: `npx prisma migrate deploy`.
2. **Cache & Queues**:
   - Provision a Redis instance.
3. **Environment Variables**:
   Create a `.env` file containing:
   ```env
   NODE_ENV=production
   DATABASE_URL="postgresql://user:pass@host:5432/dealconnect"
   REDIS_URL="redis://user:pass@host:6379"
   JWT_SECRET="your-secure-random-string-at-least-32-chars"
   META_WHATSAPP_TOKEN="your-whatsapp-cloud-api-token"
   META_PHONE_NUMBER_ID="your-whatsapp-phone-number-id"
   STORAGE_ENDPOINT="s3.eu-central-1.amazonaws.com"
   STORAGE_BUCKET="dealconnect-media"
   FRONTEND_URL="https://dealer.yourdomain.com"
   ```

## 3. Build & Deploy Process
### Building
```bash
# Install dependencies
npm ci

# Build shared packages
cd packages/shared-types && npm run build
cd ../validation && npm run build
cd ../..

# Build Backend API
cd apps/api && npm run build

# Build Frontend Web App
cd apps/web && npm run build
```

### Running Backend (API & Background Workers)
The backend uses BullMQ and Outbox patterns which require background workers.
```bash
# Navigate to API
cd apps/api

# Start Web Server on port 3001
pm2 start dist/main.js --name "dealconnect-api"

# (Optional depending on architecture) Start dedicated background workers 
# (Currently workers run embedded in main.js if not configured otherwise)
```

### Running Frontend (Next.js)
```bash
cd apps/web

# Start Next.js on port 3000
pm2 start npm --name "dealconnect-web" -- run start
```

## 4. Security & Hardening Checklist
- [ ] **Row-Level Security (RLS)**: Ensure PostgreSQL RLS is enabled if bypassing the ORM for any direct queries. (Our Prisma setup handles tenant isolation at the application layer via explicit `dealerId` injection).
- [ ] **HTTP Headers**: Validated via `helmet()` and `next.config.js`.
- [ ] **Auth Cookies**: Ensure `HttpOnly` and `Secure` flags are set to true in production. (Handled automatically if `NODE_ENV=production`).
- [ ] **CORS**: Verify `origin` matches the production frontend URL exactly.

## 5. Rollback Plan
1. Revert code via `git checkout <previous-tag>`.
2. Re-build the application.
3. Down-migrate the database (if safe), or restore from backup using `pg_restore`.
4. Restart PM2 processes: `pm2 restart all`.

## 6. Monitoring & Alerts
- Monitor Redis memory usage (BullMQ jobs can accumulate if workers fail).
- Check `/dashboard/metrics` (or dedicated health routes) for system anomalies.
- Set up alerts for `process.exit(1)` scenarios.
