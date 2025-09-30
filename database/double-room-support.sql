-- Double Room Support - Add support for Room Meter and Kitchen Meter
-- Run this in Supabase SQL Editor to add double room meter support

-- Add new columns to readings table for double room support
ALTER TABLE public.readings 
ADD COLUMN IF NOT EXISTS meter_type VARCHAR(20) DEFAULT 'single',
ADD COLUMN IF NOT EXISTS room_meter_previous INTEGER,
ADD COLUMN IF NOT EXISTS room_meter_current INTEGER,
ADD COLUMN IF NOT EXISTS kitchen_meter_previous INTEGER,
ADD COLUMN IF NOT EXISTS kitchen_meter_current INTEGER,
ADD COLUMN IF NOT EXISTS room_meter_units INTEGER GENERATED ALWAYS AS (
  CASE 
    WHEN room_meter_current IS NOT NULL AND room_meter_previous IS NOT NULL 
    THEN room_meter_current - room_meter_previous 
    ELSE NULL 
  END
) STORED,
ADD COLUMN IF NOT EXISTS kitchen_meter_units INTEGER GENERATED ALWAYS AS (
  CASE 
    WHEN kitchen_meter_current IS NOT NULL AND kitchen_meter_previous IS NOT NULL 
    THEN kitchen_meter_current - kitchen_meter_previous 
    ELSE NULL 
  END
) STORED,
ADD COLUMN IF NOT EXISTS room_meter_cost DECIMAL(10,2) GENERATED ALWAYS AS (
  CASE 
    WHEN room_meter_current IS NOT NULL AND room_meter_previous IS NOT NULL 
    THEN (room_meter_current - room_meter_previous) * rate_per_unit
    ELSE NULL 
  END
) STORED,
ADD COLUMN IF NOT EXISTS kitchen_meter_cost DECIMAL(10,2) GENERATED ALWAYS AS (
  CASE 
    WHEN kitchen_meter_current IS NOT NULL AND kitchen_meter_previous IS NOT NULL 
    THEN (kitchen_meter_current - kitchen_meter_previous) * rate_per_unit
    ELSE NULL 
  END
) STORED,
ADD COLUMN IF NOT EXISTS total_double_room_cost DECIMAL(10,2) GENERATED ALWAYS AS (
  CASE 
    WHEN meter_type = 'double' AND room_meter_current IS NOT NULL AND kitchen_meter_current IS NOT NULL
    THEN COALESCE((room_meter_current - room_meter_previous) * rate_per_unit, 0) + 
         COALESCE((kitchen_meter_current - kitchen_meter_previous) * rate_per_unit, 0)
    ELSE electricity_cost
  END
) STORED;

-- Update the electricity_cost column to use the new total for double rooms
-- Note: This will be handled in the application logic since we can't easily modify generated columns

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_readings_meter_type ON public.readings(meter_type);
CREATE INDEX IF NOT EXISTS idx_readings_tenant_meter_type ON public.readings(tenant_id, meter_type);

-- Add some sample room types if they don't exist
UPDATE public.rooms SET room_type = 'single' WHERE room_type IS NULL OR room_type = '';
INSERT INTO public.rooms (room_number, floor_number, room_type, monthly_rent) 
VALUES 
  ('301', 3, 'double', 25000),
  ('302', 3, 'double', 25000)
ON CONFLICT (room_number) DO NOTHING;

COMMENT ON COLUMN public.readings.meter_type IS 'Type of meter reading: single (one meter) or double (room + kitchen meters)';
COMMENT ON COLUMN public.readings.room_meter_previous IS 'Previous reading for room meter (double rooms only)';
COMMENT ON COLUMN public.readings.room_meter_current IS 'Current reading for room meter (double rooms only)';
COMMENT ON COLUMN public.readings.kitchen_meter_previous IS 'Previous reading for kitchen meter (double rooms only)';
COMMENT ON COLUMN public.readings.kitchen_meter_current IS 'Current reading for kitchen meter (double rooms only)';

-- Success message
DO $$ 
BEGIN 
    RAISE NOTICE '✅ Double Room Meter Support Added Successfully!';
    RAISE NOTICE '🔧 Database now supports Room Meter and Kitchen Meter for double rooms';
    RAISE NOTICE '📊 Enhanced readings table with dual meter support';
END $$;