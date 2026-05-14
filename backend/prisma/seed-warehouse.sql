-- Create a default warehouse for the first tenant
-- Run this after you have a tenant and user in the database

-- Get the first tenant ID (you may need to adjust this)
DO $$
DECLARE
    v_tenant_id UUID;
BEGIN
    -- Get the first tenant
    SELECT id INTO v_tenant_id FROM tenants LIMIT 1;

    IF v_tenant_id IS NOT NULL THEN
        -- Insert default warehouse if it doesn't exist
        INSERT INTO warehouses (id, tenant_id, name, code, type, address, city, state, country, pin_code, phone, email, is_active, created_at, updated_at)
        VALUES (
            gen_random_uuid(),
            v_tenant_id,
            'Main Warehouse',
            'WH-001',
            'WAREHOUSE',
            '123 Main Street',
            'Mumbai',
            'Maharashtra',
            'India',
            '400001',
            '+91-9876543210',
            'warehouse@company.com',
            true,
            NOW(),
            NOW()
        )
        ON CONFLICT (tenant_id, code) DO NOTHING;

        RAISE NOTICE 'Default warehouse created for tenant: %', v_tenant_id;
    ELSE
        RAISE NOTICE 'No tenant found. Please create a tenant first.';
    END IF;
END $$;
