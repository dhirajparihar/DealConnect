-- Enable and FORCE Row Level Security (RLS) on all tenant-owned tables
-- FORCE ROW LEVEL SECURITY ensures policies apply even for the table owner/connection user.

-- 1. Customers
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

-- 2. Customer Consents
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

-- 3. Requirements
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

-- 4. Vehicles
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

-- 5. Vehicle Media
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

-- 6. Matches
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

-- 7. Notifications
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

-- 8. Followups
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

-- 9. Activities
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
