-- Double Room Support - FIXED VERSION
-- Run this in Supabase SQL Editor to add double room meter support
-- This version avoids generated column reference issues

-- Add new columns to readings table for double room support
ALTER TABLE public.readings 
ADD COLUMN IF NOT EXISTS meter_type VARCHAR(20) DEFAULT 'single',
ADD COLUMN IF NOT EXISTS room_meter_previous INTEGER,
ADD COLUMN IF NOT EXISTS room_meter_current INTEGER,
ADD COLUMN IF NOT EXISTS kitchen_meter_previous INTEGER,
ADD COLUMN IF NOT EXISTS kitchen_meter_current INTEGER;

-- Add simple calculated columns (without referencing other generated columns)
ALTER TABLE public.readings 
ADD COLUMN IF NOT EXISTS room_meter_units INTEGER GENERATED ALWAYS AS (
  CASE 
    WHEN room_meter_current IS NOT NULL AND room_meter_previous IS NOT NULL 
    THEN room_meter_current - room_meter_previous 
    ELSE NULL 
  END
) STORED;

ALTER TABLE public.readings 
ADD COLUMN IF NOT EXISTS kitchen_meter_units INTEGER GENERATED ALWAYS AS (
  CASE 
    WHEN kitchen_meter_current IS NOT NULL AND kitchen_meter_previous IS NOT NULL 
    THEN kitchen_meter_current - kitchen_meter_previous 
    ELSE NULL 
  END
) STORED;

ALTER TABLE public.readings 
ADD COLUMN IF NOT EXISTS room_meter_cost DECIMAL(10,2) GENERATED ALWAYS AS (
  CASE 
    WHEN room_meter_current IS NOT NULL AND room_meter_previous IS NOT NULL 
    THEN (room_meter_current - room_meter_previous) * rate_per_unit
    ELSE NULL 
  END
) STORED;

ALTER TABLE public.readings 
ADD COLUMN IF NOT EXISTS kitchen_meter_cost DECIMAL(10,2) GENERATED ALWAYS AS (
  CASE 
    WHEN kitchen_meter_current IS NOT NULL AND kitchen_meter_previous IS NOT NULL 
    THEN (kitchen_meter_current - kitchen_meter_previous) * rate_per_unit
    ELSE NULL 
  END
) STORED;

-- Add total cost column that calculates based on meter type
ALTER TABLE public.readings 
ADD COLUMN IF NOT EXISTS total_units_consumed INTEGER GENERATED ALWAYS AS (
  CASE 
    WHEN meter_type = 'double' AND room_meter_current IS NOT NULL AND kitchen_meter_current IS NOT NULL
    THEN COALESCE(room_meter_current - room_meter_previous, 0) + 
         COALESCE(kitchen_meter_current - kitchen_meter_previous, 0)
    WHEN meter_type = 'single' AND current_reading IS NOT NULL AND previous_reading IS NOT NULL
    THEN current_reading - previous_reading
    ELSE 0
  END
) STORED;

ALTER TABLE public.readings 
ADD COLUMN IF NOT EXISTS total_electricity_cost DECIMAL(10,2) GENERATED ALWAYS AS (
  CASE 
    WHEN meter_type = 'double' AND room_meter_current IS NOT NULL AND kitchen_meter_current IS NOT NULL
    THEN (COALESCE(room_meter_current - room_meter_previous, 0) + 
          COALESCE(kitchen_meter_current - kitchen_meter_previous, 0)) * rate_per_unit
    WHEN meter_type = 'single' AND current_reading IS NOT NULL AND previous_reading IS NOT NULL
    THEN (current_reading - previous_reading) * rate_per_unit
    ELSE 0
  END
) STORED;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_readings_meter_type ON public.readings(meter_type);
CREATE INDEX IF NOT EXISTS idx_readings_tenant_meter_type ON public.readings(tenant_id, meter_type);

-- Ensure room_type column exists and set defaults
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS room_type VARCHAR(50) DEFAULT 'single';
UPDATE public.rooms SET room_type = 'single' WHERE room_type IS NULL OR room_type = '';

-- Add some sample double rooms if they don't exist
INSERT INTO public.rooms (room_number, floor_number, room_type, monthly_rent) 
VALUES 
  ('301', 3, 'double', 25000),
  ('302', 3, 'double', 25000),
  ('303', 3, 'double', 25000)
ON CONFLICT (room_number) DO UPDATE SET 
  room_type = EXCLUDED.room_type,
  monthly_rent = EXCLUDED.monthly_rent;

-- Add comments for documentation
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
    RAISE NOTICE '✅ Double Room Meter Support Added Successfully!';
    RAISE NOTICE '🔧 Database now supports Room Meter and Kitchen Meter for double rooms';
    RAISE NOTICE '📊 Enhanced readings table with dual meter support';
    RAISE NOTICE '🏠 Added sample double rooms: 301, 302, 303';
    RAISE NOTICE '⚡ Use total_electricity_cost column for billing calculations';
END $$;