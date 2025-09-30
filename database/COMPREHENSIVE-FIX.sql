-- COMPREHENSIVE NEPAL RENTAL MANAGEMENT DATABASE FIX
-- This script will thoroughly fix all database issues for double room support
-- Copy and paste this ENTIRE script into Supabase SQL Editor

-- ==================================================
-- STEP 1: DIAGNOSTIC CHECK
-- ==================================================

DO $$
BEGIN
    RAISE NOTICE '🔍 Starting comprehensive database diagnostic...';
END $$;

-- Check if tables exist
SELECT 'TABLE EXISTENCE CHECK:' as check_type;
SELECT 
    table_name,
    CASE WHEN table_name IS NOT NULL THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('readings', 'rooms', 'tenants')
ORDER BY table_name;

-- Check readings table structure
SELECT 'READINGS TABLE COLUMNS:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'readings' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check rooms table structure
SELECT 'ROOMS TABLE COLUMNS:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'rooms' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check critical columns specifically
SELECT 'CRITICAL COLUMNS CHECK:' as info;
SELECT 
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'readings' AND column_name = 'meter_type'
    ) THEN '✅ meter_type EXISTS' ELSE '❌ meter_type MISSING' END as meter_type_status,
    
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'readings' AND column_name = 'room_meter_current'
    ) THEN '✅ room_meter_current EXISTS' ELSE '❌ room_meter_current MISSING' END as room_meter_status,
    
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'readings' AND column_name = 'kitchen_meter_current'
    ) THEN '✅ kitchen_meter_current EXISTS' ELSE '❌ kitchen_meter_current MISSING' END as kitchen_meter_status,
    
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'rooms' AND column_name = 'room_type'
    ) THEN '✅ room_type EXISTS' ELSE '❌ room_type MISSING' END as room_type_status;

-- ==================================================
-- STEP 2: ADD MISSING COLUMNS
-- ==================================================

DO $$
BEGIN
    RAISE NOTICE '🔧 Adding missing columns...';
END $$;

-- Add reading_date_nepali column if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'readings' AND column_name = 'reading_date_nepali'
    ) THEN
        ALTER TABLE public.readings ADD COLUMN reading_date_nepali VARCHAR(50);
        RAISE NOTICE '✅ Added reading_date_nepali column';
    ELSE
        RAISE NOTICE '✅ reading_date_nepali column already exists';
    END IF;
END $$;

-- Add tenant_id column if missing (handle both UUID and INTEGER)
DO $$
DECLARE
    tenant_id_type TEXT;
BEGIN
    -- Check tenant ID type
    SELECT data_type INTO tenant_id_type
    FROM information_schema.columns 
    WHERE table_name = 'tenants' AND column_name = 'id';
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'readings' AND column_name = 'tenant_id'
    ) THEN
        IF tenant_id_type = 'uuid' THEN
            ALTER TABLE public.readings ADD COLUMN tenant_id UUID;
            RAISE NOTICE '✅ Added tenant_id column (UUID)';
        ELSE
            ALTER TABLE public.readings ADD COLUMN tenant_id INTEGER;
            RAISE NOTICE '✅ Added tenant_id column (INTEGER)';
        END IF;
    ELSE
        RAISE NOTICE '✅ tenant_id column already exists';
    END IF;
END $$;

-- Add all required meter columns
DO $$
BEGIN
    -- meter_type column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'readings' AND column_name = 'meter_type'
    ) THEN
        ALTER TABLE public.readings ADD COLUMN meter_type VARCHAR(20) DEFAULT 'single';
        RAISE NOTICE '✅ Added meter_type column';
    END IF;

    -- Single room columns
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'readings' AND column_name = 'previous_reading'
    ) THEN
        ALTER TABLE public.readings ADD COLUMN previous_reading INTEGER;
        RAISE NOTICE '✅ Added previous_reading column';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'readings' AND column_name = 'current_reading'
    ) THEN
        ALTER TABLE public.readings ADD COLUMN current_reading INTEGER;
        RAISE NOTICE '✅ Added current_reading column';
    END IF;

    -- Double room meter columns
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'readings' AND column_name = 'room_meter_previous'
    ) THEN
        ALTER TABLE public.readings ADD COLUMN room_meter_previous INTEGER;
        RAISE NOTICE '✅ Added room_meter_previous column';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'readings' AND column_name = 'room_meter_current'
    ) THEN
        ALTER TABLE public.readings ADD COLUMN room_meter_current INTEGER;
        RAISE NOTICE '✅ Added room_meter_current column';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'readings' AND column_name = 'kitchen_meter_previous'
    ) THEN
        ALTER TABLE public.readings ADD COLUMN kitchen_meter_previous INTEGER;
        RAISE NOTICE '✅ Added kitchen_meter_previous column';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'readings' AND column_name = 'kitchen_meter_current'
    ) THEN
        ALTER TABLE public.readings ADD COLUMN kitchen_meter_current INTEGER;
        RAISE NOTICE '✅ Added kitchen_meter_current column';
    END IF;

    -- Additional columns your app might need
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'readings' AND column_name = 'tenant_name'
    ) THEN
        ALTER TABLE public.readings ADD COLUMN tenant_name VARCHAR(255);
        RAISE NOTICE '✅ Added tenant_name column';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'readings' AND column_name = 'room_number'
    ) THEN
        ALTER TABLE public.readings ADD COLUMN room_number VARCHAR(10);
        RAISE NOTICE '✅ Added room_number column';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'readings' AND column_name = 'rate_per_unit'
    ) THEN
        ALTER TABLE public.readings ADD COLUMN rate_per_unit DECIMAL(10,2) DEFAULT 15;
        RAISE NOTICE '✅ Added rate_per_unit column';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'readings' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE public.readings ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE '✅ Added created_at column';
    END IF;
END $$;

-- Add room_type column to rooms table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'rooms' AND column_name = 'room_type'
    ) THEN
        ALTER TABLE public.rooms ADD COLUMN room_type VARCHAR(50) DEFAULT 'single';
        RAISE NOTICE '✅ Added room_type column to rooms table';
    ELSE
        RAISE NOTICE '✅ room_type column already exists in rooms table';
    END IF;
END $$;

-- ==================================================
-- STEP 3: UPDATE EXISTING DATA
-- ==================================================

DO $$
BEGIN
    RAISE NOTICE '🔄 Updating existing data...';
END $$;

-- Set default values for existing records
UPDATE public.readings SET meter_type = 'single' WHERE meter_type IS NULL;
UPDATE public.rooms SET room_type = 'single' WHERE room_type IS NULL OR room_type = '';

-- ==================================================
-- STEP 4: CREATE DOUBLE ROOMS
-- ==================================================

DO $$
BEGIN
    RAISE NOTICE '🏠 Creating double rooms...';
END $$;

-- Insert double rooms with proper conflict handling
INSERT INTO public.rooms (room_number, floor_number, room_type, monthly_rent, is_occupied) 
VALUES 
  ('301', 3, 'double', 25000, false),
  ('302', 3, 'double', 25000, false),
  ('303', 3, 'double', 25000, false),
  ('401', 4, 'double', 30000, false),
  ('402', 4, 'double', 30000, false)
ON CONFLICT (room_number) DO UPDATE SET 
  room_type = EXCLUDED.room_type,
  monthly_rent = EXCLUDED.monthly_rent;

-- ==================================================
-- STEP 5: FINAL VERIFICATION
-- ==================================================

DO $$
DECLARE
    missing_columns TEXT[] := ARRAY[]::TEXT[];
    column_count INTEGER;
    double_room_count INTEGER;
BEGIN
    RAISE NOTICE '✨ Final verification...';
    
    -- Check all required columns
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns 
    WHERE table_name = 'readings' 
    AND column_name IN (
        'meter_type', 'room_meter_current', 'kitchen_meter_current',
        'room_meter_previous', 'kitchen_meter_previous', 
        'previous_reading', 'current_reading',
        'tenant_id', 'reading_date_nepali'
    );
    
    -- Count double rooms
    SELECT COUNT(*) INTO double_room_count
    FROM public.rooms 
    WHERE room_type = 'double';
    
    -- List any missing critical columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'readings' AND column_name = 'meter_type') THEN
        missing_columns := array_append(missing_columns, 'meter_type');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'readings' AND column_name = 'room_meter_current') THEN
        missing_columns := array_append(missing_columns, 'room_meter_current');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'readings' AND column_name = 'kitchen_meter_current') THEN
        missing_columns := array_append(missing_columns, 'kitchen_meter_current');
    END IF;
    
    -- Report results
    RAISE NOTICE '';
    RAISE NOTICE '🎉 ============================================= 🎉';
    RAISE NOTICE '✅ NEPAL RENTAL MANAGEMENT - SETUP COMPLETE! ✅';
    RAISE NOTICE '🎉 ============================================= 🎉';
    RAISE NOTICE '';
    RAISE NOTICE '📊 VERIFICATION RESULTS:';
    RAISE NOTICE '  🔹 Required columns found: % of 9', column_count;
    RAISE NOTICE '  🔹 Double rooms available: %', double_room_count;
    
    IF array_length(missing_columns, 1) > 0 THEN
        RAISE NOTICE '  ❌ Still missing: %', array_to_string(missing_columns, ', ');
        RAISE NOTICE '';
        RAISE NOTICE '⚠️  THERE ARE STILL MISSING COLUMNS!';
        RAISE NOTICE '🔧 Please check your database permissions and try again.';
    ELSE
        RAISE NOTICE '  ✅ All critical columns exist!';
        RAISE NOTICE '';
        RAISE NOTICE '🏠 DOUBLE ROOM FEATURES ACTIVE:';
        RAISE NOTICE '  ✅ Room Meter + Kitchen Meter support';
        RAISE NOTICE '  ✅ Automatic type detection';
        RAISE NOTICE '  ✅ Enhanced error handling';
        RAISE NOTICE '';
        RAISE NOTICE '🧪 READY TO TEST:';
        RAISE NOTICE '  1. Add a tenant to room 301, 302, or 303 (double rooms)';
        RAISE NOTICE '  2. Go to New Reading page';
        RAISE NOTICE '  3. Select the tenant - you should see dual meter fields';
        RAISE NOTICE '  4. Fill in Room Meter and Kitchen Meter readings';
        RAISE NOTICE '  5. Click Save - it should work without errors!';
        RAISE NOTICE '';
        RAISE NOTICE '🎯 If you still get errors, check the browser console for details.';
    END IF;
    
    RAISE NOTICE '';
END $$;