-- Full PostgreSQL Schema DDL matching 01_ERD.md & 02_RBAC_AND_TENANCY.md

CREATE TABLE dealers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(160) NOT NULL,
  slug VARCHAR(120) NOT NULL UNIQUE,
  phone VARCHAR(30),
  email VARCHAR(254),
  status VARCHAR(30) NOT NULL DEFAULT 'active',
  plan_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(160) NOT NULL,
  phone VARCHAR(30),
  email VARCHAR(254),
  auth_status VARCHAR(30) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE dealer_users (
  dealer_id UUID NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(30) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (dealer_id, user_id)
);

CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id UUID NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
  name VARCHAR(160) NOT NULL,
  normalized_phone VARCHAR(30) NOT NULL,
  email VARCHAR(254),
  status VARCHAR(30) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (dealer_id, normalized_phone)
);

CREATE TABLE customer_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id UUID NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  consent_type VARCHAR(50) NOT NULL,
  channel VARCHAR(30) NOT NULL,
  granted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  source VARCHAR(50),
  policy_version VARCHAR(30),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id UUID NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  status VARCHAR(30) NOT NULL DEFAULT 'searching',
  priority VARCHAR(20) NOT NULL DEFAULT 'normal',
  source VARCHAR(30) NOT NULL DEFAULT 'customer_portal',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ
);

CREATE TABLE requirement_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requirement_id UUID NOT NULL UNIQUE REFERENCES requirements(id) ON DELETE CASCADE,
  make VARCHAR(80),
  model VARCHAR(100),
  variant VARCHAR(120),
  min_year SMALLINT,
  max_year SMALLINT,
  min_price NUMERIC(14,2),
  max_price NUMERIC(14,2),
  fuel VARCHAR(30),
  transmission VARCHAR(30),
  max_km INTEGER,
  location_lat NUMERIC(9,6),
  location_lng NUMERIC(9,6),
  radius_km NUMERIC(8,2),
  color VARCHAR(50),
  preference_rules JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id UUID NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
  stock_number VARCHAR(80) NOT NULL,
  make VARCHAR(80) NOT NULL,
  model VARCHAR(100) NOT NULL,
  variant VARCHAR(120),
  year SMALLINT NOT NULL,
  price NUMERIC(14,2) NOT NULL,
  fuel VARCHAR(30),
  transmission VARCHAR(30),
  kilometers INTEGER,
  location_lat NUMERIC(9,6),
  location_lng NUMERIC(9,6),
  status VARCHAR(30) NOT NULL DEFAULT 'available',
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sold_at TIMESTAMPTZ,
  UNIQUE (dealer_id, stock_number)
);

CREATE TABLE vehicle_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id UUID NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  storage_key TEXT NOT NULL,
  media_type VARCHAR(30) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id UUID NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
  requirement_id UUID NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  score NUMERIC(5,2) NOT NULL,
  score_breakdown JSONB NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'new',
  notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (requirement_id, vehicle_id)
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id UUID NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  match_id UUID REFERENCES matches(id) ON DELETE SET NULL,
  channel VARCHAR(30) NOT NULL,
  type VARCHAR(50) NOT NULL,
  provider_message_id VARCHAR(200),
  status VARCHAR(30) NOT NULL DEFAULT 'queued',
  idempotency_key VARCHAR(255) NOT NULL UNIQUE,
  attempts INTEGER NOT NULL DEFAULT 0,
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  failure_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE followups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id UUID NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  requirement_id UUID REFERENCES requirements(id) ON DELETE SET NULL,
  assigned_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  type VARCHAR(40) NOT NULL,
  due_at TIMESTAMPTZ NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'open',
  notes TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id UUID NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  requirement_id UUID REFERENCES requirements(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  activity_type VARCHAR(60) NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE outbox_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id UUID REFERENCES dealers(id) ON DELETE SET NULL,
  event_type VARCHAR(100) NOT NULL,
  aggregate_type VARCHAR(50) NOT NULL,
  aggregate_id UUID NOT NULL,
  payload JSONB NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  attempts INTEGER NOT NULL DEFAULT 0,
  available_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id UUID REFERENCES dealers(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(80) NOT NULL,
  entity_type VARCHAR(60) NOT NULL,
  entity_id UUID,
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_customers_dealer_status ON customers(dealer_id, status);
CREATE INDEX idx_requirements_dealer_status ON requirements(dealer_id, status);
CREATE INDEX idx_req_customer_status ON requirements(dealer_id, customer_id, status);
CREATE INDEX idx_vehicles_dealer_status ON vehicles(dealer_id, status);
CREATE INDEX idx_vehicles_dealer_model_status ON vehicles(dealer_id, make, model, status);
CREATE INDEX idx_vehicles_dealer_price ON vehicles(dealer_id, price);
CREATE INDEX idx_matches_requirement ON matches(dealer_id, requirement_id);
CREATE INDEX idx_matches_vehicle ON matches(dealer_id, vehicle_id);
CREATE INDEX idx_notifications_customer ON notifications(dealer_id, customer_id, created_at DESC);
CREATE INDEX idx_followups_due ON followups(dealer_id, status, due_at);
CREATE INDEX idx_outbox_pending ON outbox_events(status, available_at);

-- Row Level Security (RLS) Policies with FORCE ROW LEVEL SECURITY
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers FORCE ROW LEVEL SECURITY;
CREATE POLICY dealer_isolation_customers ON customers
    FOR ALL
    USING (
        dealer_id = NULLIF(current_setting('app.current_dealer_id', true), '')::uuid
        OR current_setting('app.is_platform_admin', true) = 'true'
    )
    WITH CHECK (
        dealer_id = NULLIF(current_setting('app.current_dealer_id', true), '')::uuid
        OR current_setting('app.is_platform_admin', true) = 'true'
    );

ALTER TABLE customer_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_consents FORCE ROW LEVEL SECURITY;
CREATE POLICY dealer_isolation_customer_consents ON customer_consents
    FOR ALL
    USING (
        dealer_id = NULLIF(current_setting('app.current_dealer_id', true), '')::uuid
        OR current_setting('app.is_platform_admin', true) = 'true'
    )
    WITH CHECK (
        dealer_id = NULLIF(current_setting('app.current_dealer_id', true), '')::uuid
        OR current_setting('app.is_platform_admin', true) = 'true'
    );

ALTER TABLE requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE requirements FORCE ROW LEVEL SECURITY;
CREATE POLICY dealer_isolation_requirements ON requirements
    FOR ALL
    USING (
        dealer_id = NULLIF(current_setting('app.current_dealer_id', true), '')::uuid
        OR current_setting('app.is_platform_admin', true) = 'true'
    )
    WITH CHECK (
        dealer_id = NULLIF(current_setting('app.current_dealer_id', true), '')::uuid
        OR current_setting('app.is_platform_admin', true) = 'true'
    );

ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles FORCE ROW LEVEL SECURITY;
CREATE POLICY dealer_isolation_vehicles ON vehicles
    FOR ALL
    USING (
        dealer_id = NULLIF(current_setting('app.current_dealer_id', true), '')::uuid
        OR current_setting('app.is_platform_admin', true) = 'true'
    )
    WITH CHECK (
        dealer_id = NULLIF(current_setting('app.current_dealer_id', true), '')::uuid
        OR current_setting('app.is_platform_admin', true) = 'true'
    );

ALTER TABLE vehicle_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_media FORCE ROW LEVEL SECURITY;
CREATE POLICY dealer_isolation_vehicle_media ON vehicle_media
    FOR ALL
    USING (
        dealer_id = NULLIF(current_setting('app.current_dealer_id', true), '')::uuid
        OR current_setting('app.is_platform_admin', true) = 'true'
    )
    WITH CHECK (
        dealer_id = NULLIF(current_setting('app.current_dealer_id', true), '')::uuid
        OR current_setting('app.is_platform_admin', true) = 'true'
    );

ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches FORCE ROW LEVEL SECURITY;
CREATE POLICY dealer_isolation_matches ON matches
    FOR ALL
    USING (
        dealer_id = NULLIF(current_setting('app.current_dealer_id', true), '')::uuid
        OR current_setting('app.is_platform_admin', true) = 'true'
    )
    WITH CHECK (
        dealer_id = NULLIF(current_setting('app.current_dealer_id', true), '')::uuid
        OR current_setting('app.is_platform_admin', true) = 'true'
    );

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications FORCE ROW LEVEL SECURITY;
CREATE POLICY dealer_isolation_notifications ON notifications
    FOR ALL
    USING (
        dealer_id = NULLIF(current_setting('app.current_dealer_id', true), '')::uuid
        OR current_setting('app.is_platform_admin', true) = 'true'
    )
    WITH CHECK (
        dealer_id = NULLIF(current_setting('app.current_dealer_id', true), '')::uuid
        OR current_setting('app.is_platform_admin', true) = 'true'
    );

ALTER TABLE followups ENABLE ROW LEVEL SECURITY;
ALTER TABLE followups FORCE ROW LEVEL SECURITY;
CREATE POLICY dealer_isolation_followups ON followups
    FOR ALL
    USING (
        dealer_id = NULLIF(current_setting('app.current_dealer_id', true), '')::uuid
        OR current_setting('app.is_platform_admin', true) = 'true'
    )
    WITH CHECK (
        dealer_id = NULLIF(current_setting('app.current_dealer_id', true), '')::uuid
        OR current_setting('app.is_platform_admin', true) = 'true'
    );

ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities FORCE ROW LEVEL SECURITY;
CREATE POLICY dealer_isolation_activities ON activities
    FOR ALL
    USING (
        dealer_id = NULLIF(current_setting('app.current_dealer_id', true), '')::uuid
        OR current_setting('app.is_platform_admin', true) = 'true'
    )
    WITH CHECK (
        dealer_id = NULLIF(current_setting('app.current_dealer_id', true), '')::uuid
        OR current_setting('app.is_platform_admin', true) = 'true'
    );
