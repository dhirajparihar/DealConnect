# Used-Car Customer Demand & Vehicle Alert Platform
## Implementation-Ready Specification — V1

This package converts the product/build specification into an implementation-ready blueprint.

### Build principle
Build a private dealer ecosystem:
- Each dealer owns customers and inventory.
- Customers join through the dealer's unique link/QR.
- Customer mobile is verified with OTP.
- Existing customers are recognized within that dealer.
- Customers can have multiple requirements.
- Dealer inventory is matched automatically.
- Matching and notifications run asynchronously.
- Customer receives WhatsApp/web notifications.
- Dealer receives qualified-interest alerts.
- No cross-dealer data sharing in V1.

### Recommended stack
- Web: Next.js + React + TypeScript
- API: NestJS + TypeScript
- Database: PostgreSQL
- ORM: Prisma or equivalent
- Cache/queue: Redis + BullMQ or managed equivalent
- Object storage: S3-compatible
- Messaging: WhatsApp Business API through an abstraction/provider adapter
- Auth: OTP + secure session
- Observability: OpenTelemetry + error tracking
- Deployment: managed cloud

### Architecture
Modular monolith first. Keep module boundaries clean so Matching and Notifications can be extracted later.

### Delivery order
1. Foundation / tenant security
2. Dealer
3. Customer portal
4. Requirements
5. Inventory
6. Matching
7. Notifications
8. Follow-ups
9. QA/security/performance
10. Pilot
