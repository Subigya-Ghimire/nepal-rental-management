-- Nepal Rental Management - Complete Diagnostic & Fix
-- Run this step by step in Supabase SQL Editor

-- STEP 1: Check if readings table exists
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_name = 'readings' AND table_schema = 'public';

-- STEP 2: Check current columns in readings table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'readings' AND table_schema = 'public'
ORDER BY ordinal_position;

-- STEP 3: Check if rooms table has room_type column
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'rooms' AND table_schema = 'public'
AND column_name = 'room_type';

-- STEP 4: Check existing rooms and their types
SELECT room_number, room_type, floor_number, monthly_rent, is_occupied
FROM public.rooms 
ORDER BY room_number;

-- STEP 5: Check if any double room columns exist
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'readings' 
AND table_schema = 'public'
AND column_name IN ('meter_type', 'room_meter_current', 'kitchen_meter_current');

-- STEP 6: Force add meter_type column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'readings' 
        AND table_schema = 'public' 
        AND column_name = 'meter_type'
    ) THEN
        ALTER TABLE public.readings ADD COLUMN meter_type VARCHAR(20) DEFAULT 'single';
        RAISE NOTICE '✅ Added meter_type column';
    ELSE
        RAISE NOTICE '⚠️ meter_type column already exists';
    END IF;
END $$;

-- STEP 7: Force add room_type column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'rooms' 
        AND table_schema = 'public' 
        AND column_name = 'room_type'
    ) THEN
        ALTER TABLE public.rooms ADD COLUMN room_type VARCHAR(50) DEFAULT 'single';
        RAISE NOTICE '✅ Added room_type column';
    ELSE
        RAISE NOTICE '⚠️ room_type column already exists';
    END IF;
END $$;

-- STEP 8: Add remaining double room columns one by one
DO $$
BEGIN
    -- room_meter_previous
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'readings' AND column_name = 'room_meter_previous'
    ) THEN
        ALTER TABLE public.readings ADD COLUMN room_meter_previous INTEGER;
        RAISE NOTICE '✅ Added room_meter_previous column';
    END IF;

    -- room_meter_current
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'readings' AND column_name = 'room_meter_current'
    ) THEN
        ALTER TABLE public.readings ADD COLUMN room_meter_current INTEGER;
        RAISE NOTICE '✅ Added room_meter_current column';
    END IF;

    -- kitchen_meter_previous
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'readings' AND column_name = 'kitchen_meter_previous'
    ) THEN
        ALTER TABLE public.readings ADD COLUMN kitchen_meter_previous INTEGER;
        RAISE NOTICE '✅ Added kitchen_meter_previous column';
    END IF;

    -- kitchen_meter_current
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'readings' AND column_name = 'kitchen_meter_current'
    ) THEN
        ALTER TABLE public.readings ADD COLUMN kitchen_meter_current INTEGER;
        RAISE NOTICE '✅ Added kitchen_meter_current column';
    END IF;
END $$;

-- STEP 9: Set default room types
UPDATE public.rooms SET room_type = 'single' WHERE room_type IS NULL OR room_type = '';

-- STEP 10: Add sample double rooms
INSERT INTO public.rooms (room_number, floor_number, room_type, monthly_rent, is_occupied) 
VALUES 
  ('301', 3, 'double', 25000, false),
  ('302', 3, 'double', 25000, false),
  ('303', 3, 'double', 25000, false)
ON CONFLICT (room_number) DO UPDATE SET 
  room_type = EXCLUDED.room_type,
  monthly_rent = EXCLUDED.monthly_rent;

-- STEP 11: Final verification
SELECT 'FINAL CHECK' as status;

SELECT 'Readings table columns:' as info;
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'readings' AND table_schema = 'public'
AND column_name LIKE '%meter%'
ORDER BY column_name;

SELECT 'Double rooms available:' as info;
SELECT room_number, room_type, monthly_rent
FROM public.rooms 
WHERE room_type = 'double'
ORDER BY room_number;

-- Success message
DO $$ 
BEGIN 
    RAISE NOTICE '🎉 DIAGNOSTIC AND SETUP COMPLETE! 🎉';
    RAISE NOTICE '';
    RAISE NOTICE '✅ All required columns should now exist';
    RAISE NOTICE '✅ Double rooms 301, 302, 303 are available';
    RAISE NOTICE '';
    RAISE NOTICE '🧪 TEST: Try creating a tenant in room 301 and adding double meter readings';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 If still having issues, check browser console for exact error messages';
END $$;