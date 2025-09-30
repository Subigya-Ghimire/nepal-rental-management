-- Nepal Rental Management System - Complete Updated Database Schema
-- Run this in Supabase SQL Editor to set up your production database
-- This includes Nepali date support and optional move-in dates

-- First, enable Row Level Security on any existing tables
DO $$ 
DECLARE
    table_name text;
BEGIN
    FOR table_name IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('rooms', 'tenants', 'readings', 'bills', 'payments')
    LOOP
        EXECUTE 'ALTER TABLE IF EXISTS public.' || table_name || ' ENABLE ROW LEVEL SECURITY';
    END LOOP;
END $$;

-- Drop existing tables if they exist (clean start)
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.bills CASCADE;
DROP TABLE IF EXISTS public.readings CASCADE;
DROP TABLE IF EXISTS public.tenants CASCADE;
DROP TABLE IF EXISTS public.rooms CASCADE;

-- Create rooms table
CREATE TABLE public.rooms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_number VARCHAR(10) UNIQUE NOT NULL,
    floor_number INTEGER NOT NULL,
    room_type VARCHAR(50) NOT NULL DEFAULT 'single',
    monthly_rent DECIMAL(10,2) NOT NULL,
    is_occupied BOOLEAN DEFAULT FALSE,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tenants table (updated with Nepali date support and optional move-in date)
CREATE TABLE public.tenants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20), -- Made optional (no NOT NULL constraint)
    email VARCHAR(100),
    room_id UUID REFERENCES public.rooms(id),
    room_number VARCHAR(10) NOT NULL,
    monthly_rent DECIMAL(10,2) NOT NULL,
    security_deposit DECIMAL(10,2) NOT NULL,
    move_in_date DATE, -- Made optional since form doesn't collect this
    move_in_date_nepali VARCHAR(20), -- Nepali date support (optional)
    move_out_date DATE,
    move_out_date_nepali VARCHAR(20), -- Nepali date support (optional)
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create readings table (updated with Nepali date support and double room meter support)
CREATE TABLE public.readings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID REFERENCES public.tenants(id) NOT NULL,
    tenant_name VARCHAR(100) NOT NULL,
    room_number VARCHAR(10) NOT NULL,
    reading_date DATE, -- Made optional since we're using Nepali dates
    reading_date_nepali VARCHAR(20) NOT NULL, -- Primary date field in Nepali
    
    -- Single room meter fields
    previous_reading INTEGER DEFAULT 0,
    current_reading INTEGER,
    units_consumed INTEGER GENERATED ALWAYS AS (
        CASE 
            WHEN current_reading IS NOT NULL AND previous_reading IS NOT NULL 
            THEN current_reading - previous_reading 
            ELSE NULL 
        END
    ) STORED,
    
    -- Double room meter support
    meter_type VARCHAR(20) DEFAULT 'single',
    room_meter_previous INTEGER,
    room_meter_current INTEGER,
    kitchen_meter_previous INTEGER,
    kitchen_meter_current INTEGER,
    room_meter_units INTEGER GENERATED ALWAYS AS (
        CASE 
            WHEN room_meter_current IS NOT NULL AND room_meter_previous IS NOT NULL 
            THEN room_meter_current - room_meter_previous 
            ELSE NULL 
        END
    ) STORED,
    kitchen_meter_units INTEGER GENERATED ALWAYS AS (
        CASE 
            WHEN kitchen_meter_current IS NOT NULL AND kitchen_meter_previous IS NOT NULL 
            THEN kitchen_meter_current - kitchen_meter_previous 
            ELSE NULL 
        END
    ) STORED,
    room_meter_cost DECIMAL(10,2) GENERATED ALWAYS AS (
        CASE 
            WHEN room_meter_current IS NOT NULL AND room_meter_previous IS NOT NULL 
            THEN (room_meter_current - room_meter_previous) * rate_per_unit
            ELSE NULL 
        END
    ) STORED,
    kitchen_meter_cost DECIMAL(10,2) GENERATED ALWAYS AS (
        CASE 
            WHEN kitchen_meter_current IS NOT NULL AND kitchen_meter_previous IS NOT NULL 
            THEN (kitchen_meter_current - kitchen_meter_previous) * rate_per_unit
            ELSE NULL 
        END
    ) STORED,
    
    -- Universal fields
    rate_per_unit DECIMAL(10,2) NOT NULL DEFAULT 15.00,
    total_units_consumed INTEGER GENERATED ALWAYS AS (
        CASE 
            WHEN meter_type = 'double' AND room_meter_current IS NOT NULL AND kitchen_meter_current IS NOT NULL
            THEN COALESCE(room_meter_current - room_meter_previous, 0) + 
                 COALESCE(kitchen_meter_current - kitchen_meter_previous, 0)
            WHEN meter_type = 'single' AND current_reading IS NOT NULL AND previous_reading IS NOT NULL
            THEN current_reading - previous_reading
            ELSE 0
        END
    ) STORED,
    electricity_cost DECIMAL(10,2) GENERATED ALWAYS AS ((current_reading - previous_reading) * rate_per_unit) STORED,
    total_electricity_cost DECIMAL(10,2) GENERATED ALWAYS AS (
        CASE 
            WHEN meter_type = 'double' AND room_meter_current IS NOT NULL AND kitchen_meter_current IS NOT NULL
            THEN (COALESCE(room_meter_current - room_meter_previous, 0) + 
                  COALESCE(kitchen_meter_current - kitchen_meter_previous, 0)) * rate_per_unit
            WHEN meter_type = 'single' AND current_reading IS NOT NULL AND previous_reading IS NOT NULL
            THEN (current_reading - previous_reading) * rate_per_unit
            ELSE 0
        END
    ) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bills table (updated with Nepali date support)
CREATE TABLE public.bills (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID REFERENCES public.tenants(id) NOT NULL,
    tenant_name VARCHAR(100) NOT NULL,
    room_number VARCHAR(10) NOT NULL,
    bill_date DATE, -- Made optional since we're using Nepali dates  
    bill_date_nepali VARCHAR(20) NOT NULL, -- Primary date field in Nepali
    rent_amount DECIMAL(10,2) NOT NULL,
    electricity_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    previous_balance DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(10,2) GENERATED ALWAYS AS (rent_amount + electricity_amount + previous_balance) STORED,
    notes TEXT,
    is_paid BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payments table (updated with Nepali date support)
CREATE TABLE public.payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID REFERENCES public.tenants(id) NOT NULL,
    tenant_name VARCHAR(100) NOT NULL,
    room_number VARCHAR(10) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_date_nepali VARCHAR(20), -- Nepali date support
    payment_method VARCHAR(20) DEFAULT 'cash',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_tenants_room_number ON public.tenants(room_number);
CREATE INDEX idx_tenants_is_active ON public.tenants(is_active);
CREATE INDEX idx_readings_tenant_id ON public.readings(tenant_id);
CREATE INDEX idx_readings_date ON public.readings(reading_date);
CREATE INDEX idx_readings_meter_type ON public.readings(meter_type);
CREATE INDEX idx_readings_tenant_meter_type ON public.readings(tenant_id, meter_type);
CREATE INDEX idx_bills_tenant_id ON public.bills(tenant_id);
CREATE INDEX idx_bills_date ON public.bills(bill_date);
CREATE INDEX idx_payments_tenant_id ON public.payments(tenant_id);
CREATE INDEX idx_payments_date ON public.payments(payment_date);

-- Insert sample rooms with different types
INSERT INTO public.rooms (room_number, floor_number, room_type, monthly_rent) 
VALUES 
    ('101', 1, 'single', 15000),
    ('102', 1, 'single', 15000),
    ('103', 1, 'single', 15000),
    ('201', 2, 'single', 18000),
    ('202', 2, 'single', 18000),
    ('203', 2, 'single', 18000),
    ('301', 3, 'double', 25000),
    ('302', 3, 'double', 25000),
    ('303', 3, 'double', 25000)
ON CONFLICT (room_number) DO UPDATE SET 
    room_type = EXCLUDED.room_type,
    monthly_rent = EXCLUDED.monthly_rent;

-- Add comments for documentation
COMMENT ON TABLE public.rooms IS 'Rooms available for rent';
COMMENT ON TABLE public.tenants IS 'Current and past tenants';
COMMENT ON TABLE public.readings IS 'Electricity meter readings (supports both single and double room meters)';
COMMENT ON TABLE public.bills IS 'Monthly bills generated for tenants';
COMMENT ON TABLE public.payments IS 'Payment records from tenants';

COMMENT ON COLUMN public.readings.meter_type IS 'Type of meter reading: single (one meter) or double (room + kitchen meters)';
COMMENT ON COLUMN public.readings.room_meter_previous IS 'Previous reading for room meter (double rooms only)';
COMMENT ON COLUMN public.readings.room_meter_current IS 'Current reading for room meter (double rooms only)';
COMMENT ON COLUMN public.readings.kitchen_meter_previous IS 'Previous reading for kitchen meter (double rooms only)';
COMMENT ON COLUMN public.readings.kitchen_meter_current IS 'Current reading for kitchen meter (double rooms only)';
COMMENT ON COLUMN public.readings.total_units_consumed IS 'Total units consumed (single meter OR room+kitchen combined)';
COMMENT ON COLUMN public.readings.total_electricity_cost IS 'Total electricity cost (works for both single and double rooms)';

-- Success message
DO $$ 
BEGIN 
    RAISE NOTICE '✅ Nepal Rental Management Database Setup Complete!';
    RAISE NOTICE '🏠 Rooms created: 9 total (6 single rooms, 3 double rooms)';
    RAISE NOTICE '📊 Double room meter support enabled';
    RAISE NOTICE '🔧 All indexes and constraints in place';
    RAISE NOTICE '📅 Nepali date support enabled';
    RAISE NOTICE '🎯 Ready for production use!';
END $$;

-- Enable Row Level Security
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all operations for now - you can restrict later)
CREATE POLICY "Allow all operations on rooms" ON public.rooms FOR ALL USING (true);
CREATE POLICY "Allow all operations on tenants" ON public.tenants FOR ALL USING (true);
CREATE POLICY "Allow all operations on readings" ON public.readings FOR ALL USING (true);
CREATE POLICY "Allow all operations on bills" ON public.bills FOR ALL USING (true);
CREATE POLICY "Allow all operations on payments" ON public.payments FOR ALL USING (true);

-- Insert sample rooms (typical Nepali rental setup)
INSERT INTO public.rooms (room_number, floor_number, room_type, monthly_rent, is_available) VALUES
('101', 1, 'single', 8000, true),
('102', 1, 'single', 8000, true),
('103', 1, 'double', 12000, true),
('104', 1, 'single', 8500, true),
('201', 2, 'single', 9000, true),
('202', 2, 'single', 9000, true),
('203', 2, 'double', 13000, true),
('204', 2, 'single', 9500, true),
('301', 3, 'single', 10000, true),
('302', 3, 'double', 14000, true),
('303', 3, 'single', 10500, true),
('304', 3, 'double', 15000, true);

-- Create a function to automatically update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON public.rooms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON public.tenants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_readings_updated_at BEFORE UPDATE ON public.readings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bills_updated_at BEFORE UPDATE ON public.bills
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Success message
DO $$ 
BEGIN 
    RAISE NOTICE '✅ Nepal Rental Management Database Setup Complete!';
    RAISE NOTICE '📊 Created tables: rooms, tenants, readings, bills, payments';
    RAISE NOTICE '🏠 Inserted % sample rooms', (SELECT COUNT(*) FROM public.rooms);
    RAISE NOTICE '🔒 Row Level Security enabled on all tables';
    RAISE NOTICE '⚡ Performance indexes created';
    RAISE NOTICE '🚀 Ready for production use with Nepali date support!';
    RAISE NOTICE '📝 Note: move_in_date is now optional in tenants table';
END $$;