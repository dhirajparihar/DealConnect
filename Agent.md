# Project Rules

1. /docs is the source of truth.
2. Never bypass dealer tenant isolation.
3. Never trust dealer_id from the client.
4. All tenant-owned tables require dealer_id.
5. Use service-layer authorization.
6. Maintain PostgreSQL RLS.
7. All important async operations use the outbox pattern.
8. Jobs must be idempotent.
9. Do not introduce microservices without approval.
10. Do not introduce AI/ML matching in V1.
11. Every feature requires automated tests.
12. Do not change database schema without a migration.
13. Do not commit secrets.
14. Do not use mock data in production code.
15. Do not modify unrelated modules.