-- Create tables for Nepali Home Rental Management System

-- Rooms table
CREATE TABLE rooms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_number VARCHAR(10) UNIQUE NOT NULL,
    room_type VARCHAR(50) NOT NULL DEFAULT 'single',
    monthly_rent DECIMAL(10,2) NOT NULL,
    is_occupied BOOLEAN DEFAULT FALSE,
    floor_number INTEGER NOT NULL DEFAULT 1,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tenants table
CREATE TABLE tenants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    room_number VARCHAR(10) REFERENCES rooms(room_number),
    monthly_rent DECIMAL(10,2) NOT NULL,
    security_deposit DECIMAL(10,2) NOT NULL,
    move_in_date DATE NOT NULL,
    move_out_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Meter readings table
CREATE TABLE meter_readings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    reading_date DATE NOT NULL,
    electricity_reading DECIMAL(10,2) NOT NULL DEFAULT 0,
    electricity_previous DECIMAL(10,2) NOT NULL DEFAULT 0,
    water_reading DECIMAL(10,2) NOT NULL DEFAULT 0,
    water_previous DECIMAL(10,2) NOT NULL DEFAULT 0,
    electricity_units DECIMAL(10,2) GENERATED ALWAYS AS (electricity_reading - electricity_previous) STORED,
    water_units DECIMAL(10,2) GENERATED ALWAYS AS (water_reading - water_previous) STORED,
    electricity_rate DECIMAL(10,4) NOT NULL DEFAULT 15.00,
    water_rate DECIMAL(10,4) NOT NULL DEFAULT 30.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bills table
CREATE TABLE bills (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    month_year VARCHAR(7) NOT NULL, -- Format: 2024-01
    room_rent DECIMAL(10,2) NOT NULL,
    electricity_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    water_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    other_charges DECIMAL(10,2) NOT NULL DEFAULT 0,
    previous_due DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(10,2) GENERATED ALWAYS AS (room_rent + electricity_amount + water_amount + other_charges + previous_due) STORED,
    due_date DATE NOT NULL,
    is_paid BOOLEAN DEFAULT FALSE,
    paid_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, month_year)
);

-- Payments table
CREATE TABLE payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    bill_id UUID REFERENCES bills(id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method VARCHAR(50) NOT NULL DEFAULT 'cash',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_tenants_room_number ON tenants(room_number);
CREATE INDEX idx_tenants_is_active ON tenants(is_active);
CREATE INDEX idx_meter_readings_tenant_id ON meter_readings(tenant_id);
CREATE INDEX idx_meter_readings_date ON meter_readings(reading_date);
CREATE INDEX idx_bills_tenant_id ON bills(tenant_id);
CREATE INDEX idx_bills_month_year ON bills(month_year);
CREATE INDEX idx_bills_is_paid ON bills(is_paid);
CREATE INDEX idx_payments_tenant_id ON payments(tenant_id);
CREATE INDEX idx_payments_bill_id ON payments(bill_id);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON rooms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_meter_readings_updated_at BEFORE UPDATE ON meter_readings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bills_updated_at BEFORE UPDATE ON bills FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE meter_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create policies (for now, allow all operations for authenticated users)
-- You can modify these based on your security requirements
CREATE POLICY "Allow all operations for authenticated users" ON rooms FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all operations for authenticated users" ON tenants FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all operations for authenticated users" ON meter_readings FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all operations for authenticated users" ON bills FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all operations for authenticated users" ON payments FOR ALL USING (auth.role() = 'authenticated');

-- Insert some sample data for testing
INSERT INTO rooms (room_number, room_type, monthly_rent, floor_number, description) VALUES
('101', 'single', 15000.00, 1, 'एकल कोठा - पहिलो तला'),
('102', 'single', 15000.00, 1, 'एकल कोठा - पहिलो तला'),
('201', 'double', 18000.00, 2, 'दोहोरो कोठा - दोस्रो तला'),
('202', 'double', 18000.00, 2, 'दोहोरो कोठा - दोस्रो तला'),
('301', 'family', 25000.00, 3, 'पारिवारिक कोठा - तेस्रो तला');

-- Insert sample tenants
INSERT INTO tenants (name, phone, email, room_number, monthly_rent, security_deposit, move_in_date) VALUES
('राम प्रसाद शर्मा', '9841234567', 'ram@example.com', '101', 15000.00, 30000.00, '2024-01-01'),
('सीता देवी गुरुङ', '9857123456', 'sita@example.com', '201', 18000.00, 36000.00, '2024-02-01');

-- Update room occupancy status
UPDATE rooms SET is_occupied = TRUE WHERE room_number IN ('101', '201');