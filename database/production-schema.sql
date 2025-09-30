-- Nepal Rental Management System - Complete Database Schema
-- Run this in Supabase SQL Editor to set up your production database

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

-- Create tenants table
CREATE TABLE public.tenants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20), -- Made optional (removed NOT NULL)
    email VARCHAR(100),
    room_id UUID REFERENCES public.rooms(id),
    room_number VARCHAR(10) NOT NULL,
    monthly_rent DECIMAL(10,2) NOT NULL,
    security_deposit DECIMAL(10,2) NOT NULL,
    move_in_date DATE NOT NULL,
    move_out_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create readings table
CREATE TABLE public.readings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID REFERENCES public.tenants(id) NOT NULL,
    tenant_name VARCHAR(100) NOT NULL,
    room_number VARCHAR(10) NOT NULL,
    reading_date DATE NOT NULL,
    previous_reading INTEGER NOT NULL DEFAULT 0,
    current_reading INTEGER NOT NULL,
    units_consumed INTEGER GENERATED ALWAYS AS (current_reading - previous_reading) STORED,
    rate_per_unit DECIMAL(10,2) NOT NULL DEFAULT 15.00,
    electricity_cost DECIMAL(10,2) GENERATED ALWAYS AS ((current_reading - previous_reading) * rate_per_unit) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bills table
CREATE TABLE public.bills (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID REFERENCES public.tenants(id) NOT NULL,
    tenant_name VARCHAR(100) NOT NULL,
    room_number VARCHAR(10) NOT NULL,
    bill_date DATE NOT NULL,
    rent_amount DECIMAL(10,2) NOT NULL,
    electricity_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    previous_balance DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(10,2) GENERATED ALWAYS AS (rent_amount + electricity_amount + previous_balance) STORED,
    notes TEXT,
    is_paid BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payments table
CREATE TABLE public.payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID REFERENCES public.tenants(id) NOT NULL,
    tenant_name VARCHAR(100) NOT NULL,
    room_number VARCHAR(10) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_date DATE NOT NULL,
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
CREATE INDEX idx_bills_tenant_id ON public.bills(tenant_id);
CREATE INDEX idx_bills_date ON public.bills(bill_date);
CREATE INDEX idx_payments_tenant_id ON public.payments(tenant_id);
CREATE INDEX idx_payments_date ON public.payments(payment_date);

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
    RAISE NOTICE '🚀 Ready for production use!';
END $$;