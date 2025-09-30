-- MINIMAL FIX - Add only the essential columns for double room support
-- Run this ONLY after checking what's missing with simple-check.sql

-- Add meter_type column (CRITICAL)
ALTER TABLE public.readings 
ADD COLUMN IF NOT EXISTS meter_type VARCHAR(20) DEFAULT 'single';

-- Add double room meter columns
ALTER TABLE public.readings 
ADD COLUMN IF NOT EXISTS room_meter_previous INTEGER;

ALTER TABLE public.readings 
ADD COLUMN IF NOT EXISTS room_meter_current INTEGER;

ALTER TABLE public.readings 
ADD COLUMN IF NOT EXISTS kitchen_meter_previous INTEGER;

ALTER TABLE public.readings 
ADD COLUMN IF NOT EXISTS kitchen_meter_current INTEGER;

-- Add room_type to rooms table
ALTER TABLE public.rooms 
ADD COLUMN IF NOT EXISTS room_type VARCHAR(50) DEFAULT 'single';

-- Update existing data
UPDATE public.readings SET meter_type = 'single' WHERE meter_type IS NULL;
UPDATE public.rooms SET room_type = 'single' WHERE room_type IS NULL OR room_type = '';

-- Create double rooms
INSERT INTO public.rooms (room_number, floor_number, room_type, monthly_rent, is_occupied) 
VALUES 
  ('301', 3, 'double', 25000, false),
  ('302', 3, 'double', 25000, false),
  ('303', 3, 'double', 25000, false)
ON CONFLICT (room_number) DO UPDATE SET 
  room_type = EXCLUDED.room_type;

-- Verify the fix
SELECT 'VERIFICATION:' as check_type;
SELECT 
  COUNT(*) as meter_columns_added
FROM information_schema.columns 
WHERE table_name = 'readings' 
AND column_name IN ('meter_type', 'room_meter_current', 'kitchen_meter_current');

SELECT 'DOUBLE ROOMS CREATED:' as info;
SELECT room_number, room_type 
FROM public.rooms 
WHERE room_type = 'double';