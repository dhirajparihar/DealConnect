# DealConnect — Multi-Tenant Used-Car Dealer SaaS Platform

DealConnect is a production-ready, multi-tenant SaaS platform built for used-car dealerships and buyers. It features an automated 100-point vehicle-to-requirement matching engine, transactional outbox event architecture, PostgreSQL Row Level Security (RLS) tenant isolation, WhatsApp notification integration, and a mobile-optimized Next.js customer portal.

---

## 🚀 Key Features

* **Strict Multi-Tenant Security**: Enforces PostgreSQL `FORCE ROW LEVEL SECURITY` across all tenant data tables (`app.current_tenant_id`).
* **Deterministic 100-Point Matching Engine**: Automatically scores vehicle inventory against buyer requirements across budget, make/model, year, fuel type, transmission, mileage, and body style.
* **Transactional Outbox Event Pipeline**: Ensures reliable, decoupled notification dispatching with retry logic and exponential backoff.
* **WhatsApp & OTP Integration**: Passwordless customer login via 6-digit OTP and automated WhatsApp vehicle match alerts with full mock/Meta provider support.
* **Dealer Dashboard & Workflows**: Inventory management, lead capture, sales follow-up scheduling, team role-based access control (RBAC: `owner`, `manager`, `sales`), and real-time conversion metrics.
* **Public Customer Portal**: Dealer-branded inventory browsing (`/d/[dealerSlug]`) and custom match detail screens (`/d/[dealerSlug]/match/[matchId]`).
* **Zero-Cost Friendly**: Runs 100% locally with zero external dependencies (mock OTP, mock WhatsApp, local storage) or deploys to cloud free tiers (Neon.tech, Render, Vercel, Cloudflare R2).

---

## 🏗️ Repository Architecture

This repository is structured as an `npm` workspace monorepo:

```text
DealConnect/
├── apps/
│   ├── api/                    # Express.js REST API & Async Outbox Worker
│   │   ├── prisma/             # Schema, migrations (RLS SQL), and database seed script
│   │   └── src/
│   │       ├── common/         # RLS context, tenant middleware, error handler
│   │       ├── database/       # Prisma client & PostgreSQL pool
│   │       ├── modules/        # Auth, Customers, Vehicles, Requirements, Matching, Notifications, Outbox, Dashboard
│   └── web/                    # Next.js 14 App Router Frontend
│       ├── src/
│       │   ├── app/            # Customer Portal (/d/[dealerSlug]) & Dealer Dashboard (/dashboard)
│       │   └── components/     # UI components & shared layouts
├── packages/
│   ├── shared-types/           # Shared TypeScript interfaces, domain models, breakdowns
│   └── validation/             # Shared Zod validation schemas & phone normalizer
└── docs/                       # Architectural specifications & requirements
```

---

## 🛠️ Tech Stack

* **Frontend**: Next.js 14 (App Router), React, Tailwind CSS, TypeScript
* **Backend**: Express.js, TypeScript, Node.js
* **Database & ORM**: PostgreSQL (with RLS), Prisma ORM, `@electric-sql/pglite` (for in-memory testing)
* **Validation**: Zod (shared frontend/backend)
* **Testing**: Jest, `@electric-sql/pglite` (39 passing unit & RLS isolation tests)

---

## 🚦 Getting Started

### Prerequisites

* **Node.js**: v18.0.0 or higher
* **npm**: v9.0.0 or higher
* **PostgreSQL**: Local PostgreSQL 16+ or Docker container (optional for dev; in-memory PGlite can run tests without external DB)

---

### Local Installation & Environment Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/dhirajparihar/DealConnect.git
   cd DealConnect
   ```

2. **Install workspace dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

   Default zero-cost dev settings in `.env`:
   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/dealconnect?schema=public"
   ALLOW_MOCK_OTP=true
   OTP_PROVIDER=mock
   WHATSAPP_PROVIDER=mock
   STORAGE_PROVIDER=local
   JWT_SECRET="super-secret-key-for-dealconnect-dev-environment-32chars"
   ```

4. **Run Database Migrations & Seed Data**:
   Ensure your local PostgreSQL is running, then execute:
   ```bash
   # Apply schema & Row Level Security (RLS) policies
   npm --prefix apps/api run prisma:migrate

   # Seed sample dealers, inventory, requirements, and test users
   npm --prefix apps/api run seed
   ```

5. **Start Development Servers**:
   ```bash
   npm run dev
   ```
   * **Frontend Application**: [http://localhost:3000](http://localhost:3000)
   * **Backend API**: [http://localhost:4000/api/v1](http://localhost:4000/api/v1)

---

## 🧪 Running Tests

The test suite uses `@electric-sql/pglite` to spin up real, in-memory PostgreSQL instances executing full migrations, trigger logic, and RLS security rules without needing an external database.

Run all unit, integration, matching engine, and RLS tenant isolation tests:

```bash
npm test
```

---

## 📦 Zero-Cost Cloud Deployment

DealConnect is architected to run on 100% free cloud tiers for initial launch:

| Component | Free Cloud Provider | Setup |
| :--- | :--- | :--- |
| **Frontend** | [Vercel](https://vercel.com) | Deploy `apps/web` (Next.js preset) |
| **Backend API** | [Render.com](https://render.com) | Deploy `apps/api` as Node.js Web Service |
| **PostgreSQL Database** | [Neon.tech](https://neon.tech) | Free 0.5 GB Postgres with RLS support |
| **File Storage** | [Cloudflare R2](https://www.cloudflare.com) | 10 GB free S3-compatible storage ($0 egress) |
| **WhatsApp & OTP** | [Meta WhatsApp Cloud API](https://developers.facebook.com) | 1,000 free service messages/month |

Refer to section 2 in the documentation or response guide for detailed step-by-step deployment instructions.

---

## 📄 License

This project is proprietary software built for DealConnect. All rights reserved.
