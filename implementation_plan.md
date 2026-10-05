# Used-Car Dealer SaaS Platform — Phased Implementation Plan

## 1. Project Overview & Context
This platform is a multi-tenant SaaS application for used-car dealerships. Each dealer is an isolated tenant.
- Customers register via dealer-specific slug URLs (`/d/{dealerSlug}`) using mobile OTP verification.
- Customers record vehicle requirements (make, model, budget, year, transmission, fuel, max km, location).
- Dealers add/manage vehicle inventory.
- Deterministic matching engine (100-point scoring algorithm with hard criteria filtering and explainable JSON breakdown) automatically identifies matches.
- Asynchronous Outbox Event Pattern handles vehicle matching, notifications (WhatsApp provider abstraction), follow-ups, and audit logging.
- Strict multi-tenant isolation via database schema, service-layer authorization, and PostgreSQL Row-Level Security (RLS).

---

## 2. Technical Architecture & Tech Stack

### Monorepo Structure (`npm` Workspaces)
```text
DealConnect/
├── apps/
│   ├── api/                 # NestJS / Express + Prisma backend API & worker service
│   │   ├── src/
│   │   │   ├── common/      # Guards, Interceptors, Filters, Tenant Context, RLS Middleware
│   │   │   ├── modules/     # Auth, Dealers, Customers, Requirements, Vehicles, Matching, Notifications, Followups, Activities, Audit, Outbox, Storage, Webhooks
│   │   │   ├── database/    # Prisma Service, Migrations, RLS setup
│   │   │   └── queue/       # Redis / BullMQ & Outbox Poller / Workers
│   └── web/                 # Next.js 14+ (App Router) Frontend
│       ├── app/
│       │   ├── (customer)/  # Customer Mobile Portal (/d/[dealerSlug])
│       │   ├── (dealer)/    # Dealer Desktop/Mobile Dashboard (/dashboard/...)
│       │   └── (admin)/     # Platform Admin Panel (/admin/...)
│       ├── components/      # UI components & Design System
│       └── lib/             # API client & helpers
├── packages/
│   ├── shared-types/        # TypeScript interfaces, DTOs, Enums, Event types
│   └── validation/          # Zod / Class-validator schemas
├── docs/                    # Source of Truth specifications
├── .env.example
├── package.json
└── tsconfig.json
```

### Stack Choices
- **Frontend**: Next.js 14+ (App Router, React 18/19, TypeScript, Vanilla CSS + Tailwind utility layer, Lucide Icons, responsive UI).
- **Backend**: NestJS / Express with TypeScript, modular monolith design.
- **Database & ORM**: PostgreSQL + Prisma ORM + PostgreSQL RLS.
- **Async & Queue**: Redis + BullMQ (with fallback reliable memory queue adapter for offline dev/test runs).
- **Storage**: S3-compatible Object Storage abstraction (AWS S3 / Local Object Storage with signed URLs).
- **Messaging**: WhatsApp Business API Provider abstraction (`MessagingProvider` interface with sandbox adapter for dev/test).
- **Testing**: Jest + Supertest + `@electric-sql/pglite` / PostgreSQL for unit, integration, API, and cross-tenant security tests.

---

## 3. Phased Implementation Roadmap

| Phase | Description | Deliverables | Verification Strategy |
|---|---|---|---|
| **Phase 1** | Foundation & Infrastructure | Workspace setup, TS configs, Prisma schema, PostgreSQL migrations, RLS policies, Outbox schema, Logger, Base API structure. | Unit & Migration tests, RLS policy verification. |
| **Phase 2** | Auth & Multi-Tenancy | Tenant context middleware, Dealer User roles (Owner, Manager, Sales), OTP service, Session tokens, Tenant isolation tests. | Cross-tenant security tests (Dealer A querying Dealer B data -> HTTP 403 / 404). |
| **Phase 3** | Customer Onboarding | Public dealer landing (`/d/:slug`), OTP verification, Customer creation, Existing customer phone deduplication within dealer. | Customer registration E2E API tests, phone uniqueness constraint tests. |
| **Phase 4** | Requirements Engine | Customer requirement wizard, multi-requirement support, lifecycle status state machine (`searching`, `paused`, `closed`). | Requirement CRUD & state transition unit/integration tests. |
| **Phase 5** | Inventory & Media | Vehicle inventory management, stock number uniqueness, image upload signed URLs, vehicle statuses (`available`, `reserved`, `sold`). | Vehicle CRUD tests, stock number constraint tests, image upload validation. |
| **Phase 6** | Matching Engine | Hard-rule candidate filtering, 100-point scoring algorithm, explainable JSON breakdown, match deduplication (`requirement_id, vehicle_id`). | Scoring algorithm unit tests, candidate query performance tests. |
| **Phase 7** | Async Outbox Architecture | Outbox event creation, Outbox worker processing, Redis/Queue integration, retries with backoff, dead-letter state, idempotency keys. | Outbox worker transaction tests, crash recovery simulation. |
| **Phase 8** | WhatsApp & Notifications | `MessagingProvider` abstraction, match alert templates, notification state machine, delivery webhooks with signature verification. | Notification idempotency tests, mock provider integration tests. |
| **Phase 9** | Dealer Dashboard & Follow-ups | Dealer metrics dashboard, customer management, match review, automated follow-up creation on "Interested" response, activity timeline. | End-to-end flow test from vehicle entry to dealer follow-up creation. |
| **Phase 10** | Production Hardening | Security headers, rate limiting, error monitoring, structured logs, environment validation, backup scripts, production build. | Full build verification, OWASP security audit check. |
| **Phase 11** | Full QA & Acceptance | Complete E2E integration test suite, cross-tenant security test suite, failure/retry test suite, definition of done sign-off. | 100% passing test suite across unit, integration, E2E, and security tests. |

---

## 4. Key Security & Multi-Tenancy Principles
1. `dealer_id` must be present on every tenant-owned table (`customers`, `requirements`, `vehicles`, `matches`, `notifications`, `followups`, `activities`, `audit_logs`).
2. Client-supplied `dealer_id` is NEVER trusted. Tenant context is derived strictly from verified auth session or validated public dealer slug.
3. Database level Row Level Security (RLS) policies enforce tenant boundaries as defense-in-depth.
4. Phone numbers are unique per dealer (`UNIQUE(dealer_id, normalized_phone)`). Same phone can exist under multiple dealers.
5. All sensitive async tasks use the transactional outbox pattern to guarantee idempotency and zero event loss.
