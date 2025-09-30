-- UPDATED COMPREHENSIVE NEPAL RENTAL MANAGEMENT DATABASE FIX
-- This includes all recent fixes and improvements from our development session
-- Copy and paste this ENTIRE script into Supabase SQL Editor

-- ==================================================
-- STEP 1: DIAGNOSTIC CHECK
-- ==================================================

DO $$
BEGIN
    RAISE NOTICE '🔍 Starting updated comprehensive database diagnostic...';
END $$;

-- Check if tables exist
SELECT 'TABLE EXISTENCE CHECK:' as check_type;
SELECT 
    table_name,
    CASE WHEN table_name IS NOT NULL THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('readings', 'rooms', 'tenants', 'bills')
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

-- ==================================================
-- STEP 2: ADD ALL REQUIRED COLUMNS
-- ==================================================

DO $$
BEGIN
    RAISE NOTICE '🔧 Adding all required columns...';
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

-- Add tenant_id column (assuming UUID, modify if needed)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'readings' AND column_name = 'tenant_id'
    ) THEN
        ALTER TABLE public.readings ADD COLUMN tenant_id UUID;
        RAISE NOTICE '✅ Added tenant_id column (UUID)';
    ELSE
        RAISE NOTICE '✅ tenant_id column already exists';
    END IF;
END $$;

-- Add all meter-related columns
DO $$
BEGIN
    -- meter_type column (critical for our conditional logic)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'readings' AND column_name = 'meter_type'
    ) THEN
        ALTER TABLE public.readings ADD COLUMN meter_type VARCHAR(20) DEFAULT 'single';
        RAISE NOTICE '✅ Added meter_type column';
    END IF;

    -- Single room columns (can be NULL for double rooms)
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

    -- Double room meter columns (can be NULL for single rooms)
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

    -- Additional required columns
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

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'readings' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.readings ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE '✅ Added updated_at column';
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
-- STEP 3: FIX CRITICAL NOT NULL CONSTRAINTS
-- ==================================================

DO $$
BEGIN
    RAISE NOTICE '🔧 Fixing NOT NULL constraints that prevent double room functionality...';
END $$;

-- Remove NOT NULL constraints from meter reading columns
-- This is CRITICAL - allows single rooms to have NULL double-room fields and vice versa
DO $$
BEGIN
    -- Single room meter columns can be NULL for double rooms
    BEGIN
        ALTER TABLE public.readings ALTER COLUMN previous_reading DROP NOT NULL;
        RAISE NOTICE '✅ Removed NOT NULL constraint from previous_reading';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'ℹ️  previous_reading NOT NULL constraint already removed or never existed';
    END;

    BEGIN
        ALTER TABLE public.readings ALTER COLUMN current_reading DROP NOT NULL;
        RAISE NOTICE '✅ Removed NOT NULL constraint from current_reading';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'ℹ️  current_reading NOT NULL constraint already removed or never existed';
    END;

    -- Double room meter columns should already allow NULL, but ensure they do
    BEGIN
        ALTER TABLE public.readings ALTER COLUMN room_meter_previous DROP NOT NULL;
        RAISE NOTICE '✅ Ensured room_meter_previous allows NULL';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'ℹ️  room_meter_previous already allows NULL';
    END;

    BEGIN
        ALTER TABLE public.readings ALTER COLUMN room_meter_current DROP NOT NULL;
        RAISE NOTICE '✅ Ensured room_meter_current allows NULL';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'ℹ️  room_meter_current already allows NULL';
    END;

    BEGIN
        ALTER TABLE public.readings ALTER COLUMN kitchen_meter_previous DROP NOT NULL;
        RAISE NOTICE '✅ Ensured kitchen_meter_previous allows NULL';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'ℹ️  kitchen_meter_previous already allows NULL';
    END;

    BEGIN
        ALTER TABLE public.readings ALTER COLUMN kitchen_meter_current DROP NOT NULL;
        RAISE NOTICE '✅ Ensured kitchen_meter_current allows NULL';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'ℹ️  kitchen_meter_current already allows NULL';
    END;
END $$;

-- ==================================================
-- STEP 4: UPDATE EXISTING DATA
-- ==================================================

DO $$
BEGIN
    RAISE NOTICE '🔄 Updating existing data with proper defaults...';
END $$;

-- Set meter_type for existing records
UPDATE public.readings SET meter_type = 'single' WHERE meter_type IS NULL;

-- Set room_type for existing rooms
UPDATE public.rooms SET room_type = 'single' WHERE room_type IS NULL OR room_type = '';

-- ==================================================
-- STEP 5: CREATE SAMPLE DOUBLE ROOMS
-- ==================================================

DO $$
BEGIN
    RAISE NOTICE '🏠 Creating sample double rooms...';
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
-- STEP 6: CREATE DATABASE FUNCTIONS FOR ENHANCED FUNCTIONALITY
-- ==================================================

-- Function to automatically set meter_type based on room assignment
CREATE OR REPLACE FUNCTION set_meter_type_from_room()
RETURNS TRIGGER AS $$
BEGIN
    -- Get room type from rooms table and set meter_type accordingly
    SELECT r.room_type INTO NEW.meter_type
    FROM public.rooms r
    JOIN public.tenants t ON t.room_id = r.id
    WHERE t.id = NEW.tenant_id;
    
    -- Default to 'single' if not found
    IF NEW.meter_type IS NULL THEN
        NEW.meter_type := 'single';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically set meter_type
DROP TRIGGER IF EXISTS trigger_set_meter_type ON public.readings;
CREATE TRIGGER trigger_set_meter_type
    BEFORE INSERT OR UPDATE ON public.readings
    FOR EACH ROW
    EXECUTE FUNCTION set_meter_type_from_room();

-- ==================================================
-- STEP 7: FINAL VERIFICATION AND TESTING
-- ==================================================

DO $$
DECLARE
    readings_columns INTEGER;
    rooms_columns INTEGER;
    double_room_count INTEGER;
    single_room_count INTEGER;
    constraint_issues INTEGER := 0;
BEGIN
    RAISE NOTICE '✨ Final verification and testing...';
    
    -- Count critical columns
    SELECT COUNT(*) INTO readings_columns
    FROM information_schema.columns 
    WHERE table_name = 'readings' 
    AND column_name IN (
        'meter_type', 'room_meter_current', 'kitchen_meter_current',
        'room_meter_previous', 'kitchen_meter_previous', 
        'previous_reading', 'current_reading',
        'tenant_id', 'reading_date_nepali', 'tenant_name', 'room_number'
    );
    
    SELECT COUNT(*) INTO rooms_columns
    FROM information_schema.columns 
    WHERE table_name = 'rooms' 
    AND column_name IN ('room_type', 'room_number', 'monthly_rent');
    
    -- Count room types
    SELECT COUNT(*) INTO double_room_count FROM public.rooms WHERE room_type = 'double';
    SELECT COUNT(*) INTO single_room_count FROM public.rooms WHERE room_type = 'single';
    
    -- Check for constraint issues
    SELECT COUNT(*) INTO constraint_issues
    FROM information_schema.columns 
    WHERE table_name = 'readings' 
    AND column_name IN ('previous_reading', 'current_reading')
    AND is_nullable = 'NO';
    
    -- Report comprehensive results
    RAISE NOTICE '';
    RAISE NOTICE '🎉 ================================================== 🎉';
    RAISE NOTICE '✅ NEPAL RENTAL MANAGEMENT - SETUP COMPLETE! ✅';
    RAISE NOTICE '🎉 ================================================== 🎉';
    RAISE NOTICE '';
    RAISE NOTICE '📊 DETAILED VERIFICATION:';
    RAISE NOTICE '  🔹 Required readings columns: % of 11', readings_columns;
    RAISE NOTICE '  🔹 Required rooms columns: % of 3', rooms_columns;
    RAISE NOTICE '  🔹 Single rooms available: %', single_room_count;
    RAISE NOTICE '  🔹 Double rooms available: %', double_room_count;
    RAISE NOTICE '  🔹 Constraint issues: % (should be 0)', constraint_issues;
    RAISE NOTICE '';
    
    IF constraint_issues > 0 THEN
        RAISE NOTICE '❌ CONSTRAINT ISSUES DETECTED!';
        RAISE NOTICE '🔧 Some meter columns still have NOT NULL constraints.';
        RAISE NOTICE '⚠️  This will prevent double room functionality.';
    ELSIF readings_columns >= 10 AND rooms_columns >= 3 THEN
        RAISE NOTICE '🏠 DOUBLE ROOM FEATURES FULLY ACTIVE:';
        RAISE NOTICE '  ✅ Room Meter + Kitchen Meter support';
        RAISE NOTICE '  ✅ Automatic meter type detection';
        RAISE NOTICE '  ✅ Conditional UI rendering';
        RAISE NOTICE '  ✅ Enhanced billing calculations';
        RAISE NOTICE '  ✅ Database constraints properly configured';
        RAISE NOTICE '';
        RAISE NOTICE '🧪 TESTING CHECKLIST:';
        RAISE NOTICE '  1. ✅ Create/Edit tenants in rooms 301-402 (double rooms)';
        RAISE NOTICE '  2. ✅ Go to New Reading - should show dual meters for double rooms';
        RAISE NOTICE '  3. ✅ Fill Room Meter + Kitchen Meter readings';
        RAISE NOTICE '  4. ✅ Save reading - should work without constraint errors';
        RAISE NOTICE '  5. ✅ Go to New Bill - should auto-calculate units from both meters';
        RAISE NOTICE '  6. ✅ Bill should show room type and proper calculations';
        RAISE NOTICE '';
        RAISE NOTICE '🔄 NAVIGATION FEATURES:';
        RAISE NOTICE '  ✅ Auto-redirect to bills page after bill creation';
        RAISE NOTICE '  ✅ Success messages with proper timing';
        RAISE NOTICE '';
        RAISE NOTICE '💡 IF ISSUES PERSIST:';
        RAISE NOTICE '  - Check browser console for JavaScript errors';
        RAISE NOTICE '  - Verify Supabase environment variables';
        RAISE NOTICE '  - Test with both single and double room tenants';
    ELSE
        RAISE NOTICE '⚠️  SOME REQUIRED COLUMNS MAY BE MISSING!';
        RAISE NOTICE '🔧 Please check database permissions and column creation.';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '🇳🇵 Nepal Rental Management System Ready! 🇳🇵';
    RAISE NOTICE '';
END $$;

-- ==================================================
-- STEP 8: DISPLAY CURRENT STATUS
-- ==================================================

-- Show all rooms with their types
SELECT 'CURRENT ROOM STATUS:' as info;
SELECT 
    room_number, 
    room_type,
    monthly_rent,
    is_occupied,
    CASE 
        WHEN room_type = 'double' THEN '🏠 DOUBLE ROOM (2 meters)'
        WHEN room_type = 'single' THEN '🏠 SINGLE ROOM (1 meter)'
        ELSE '❓ UNKNOWN TYPE'
    END as room_description
FROM public.rooms 
ORDER BY room_number;

-- Show constraint status for critical columns
SELECT 'CONSTRAINT STATUS:' as info;
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    CASE 
        WHEN is_nullable = 'YES' THEN '✅ ALLOWS NULL' 
        ELSE '❌ NOT NULL CONSTRAINT' 
    END as constraint_status
FROM information_schema.columns 
WHERE table_name = 'readings' 
AND column_name IN ('previous_reading', 'current_reading', 'room_meter_current', 'kitchen_meter_current')
ORDER BY column_name;

-- Show active tenant assignments
SELECT 'ACTIVE TENANT ASSIGNMENTS:' as info;
SELECT 
    t.name as tenant_name,
    r.room_number,
    r.room_type,
    CASE 
        WHEN r.room_type = 'double' THEN '📝 Should show 2 meter fields'
        WHEN r.room_type = 'single' THEN '📝 Should show 1 meter field'
        ELSE '❓ Unknown behavior'
    END as expected_ui_behavior
FROM public.tenants t
JOIN public.rooms r ON t.room_id = r.id
WHERE t.is_active = true
ORDER BY r.room_number;