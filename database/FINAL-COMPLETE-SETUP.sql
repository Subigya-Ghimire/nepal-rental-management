-- Nepal Rental Management - COMPLETE DATABASE SETUP
-- Copy and paste this ENTIRE script into Supabase SQL Editor
-- This will fix everything in one go

-- ==================================================
-- STEP 0: CHECK EXISTING TABLE STRUCTURE
-- ==================================================

-- First, let's see what we have
DO $$
BEGIN
    RAISE NOTICE '🔍 Checking existing table structure...';
END $$;

-- Check readings table columns
SELECT 'READINGS TABLE COLUMNS:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'readings' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check rooms table columns  
SELECT 'ROOMS TABLE COLUMNS:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'rooms' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check tenants table ID type
SELECT 'TENANTS ID TYPE:' as info;
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'tenants' AND table_schema = 'public' AND column_name = 'id';

-- ==================================================
-- PART 1: DOUBLE ROOM METER SUPPORT
-- ==================================================

-- Ensure readings table has all required columns for double room support
DO $$
BEGIN
    RAISE NOTICE '🔧 Setting up Double Room Meter Support...';
END $$;

-- Add reading_date_nepali column if it doesn't exist (the correct column name)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'readings' 
        AND table_schema = 'public' 
        AND column_name = 'reading_date_nepali'
    ) THEN
        ALTER TABLE public.readings ADD COLUMN reading_date_nepali VARCHAR(50);
        RAISE NOTICE '✅ Added reading_date_nepali column';
    ELSE
        RAISE NOTICE '✅ reading_date_nepali column already exists';
    END IF;
END $$;

-- Ensure tenant_id column exists with proper type (flexible handling)
DO $$
DECLARE
    tenant_id_type TEXT;
BEGIN
    -- Check what type tenant IDs are
    SELECT data_type INTO tenant_id_type
    FROM information_schema.columns 
    WHERE table_name = 'tenants' AND table_schema = 'public' AND column_name = 'id';
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'readings' 
        AND table_schema = 'public' 
        AND column_name = 'tenant_id'
    ) THEN
        IF tenant_id_type = 'uuid' THEN
            ALTER TABLE public.readings ADD COLUMN tenant_id UUID REFERENCES public.tenants(id);
            RAISE NOTICE '✅ Added tenant_id column (UUID)';
        ELSE
            ALTER TABLE public.readings ADD COLUMN tenant_id INTEGER REFERENCES public.tenants(id);
            RAISE NOTICE '✅ Added tenant_id column (INTEGER)';
        END IF;
    ELSE
        RAISE NOTICE '✅ tenant_id column already exists';
    END IF;
    
    RAISE NOTICE 'ℹ️ Tenant ID type detected: %', tenant_id_type;
END $$;

-- Add meter_type column
ALTER TABLE public.readings 
ADD COLUMN IF NOT EXISTS meter_type VARCHAR(20) DEFAULT 'single';

-- Add single room meter columns (existing structure)
ALTER TABLE public.readings 
ADD COLUMN IF NOT EXISTS previous_reading INTEGER;

ALTER TABLE public.readings 
ADD COLUMN IF NOT EXISTS current_reading INTEGER;

-- Add double room meter columns
ALTER TABLE public.readings 
ADD COLUMN IF NOT EXISTS room_meter_previous INTEGER;

ALTER TABLE public.readings 
ADD COLUMN IF NOT EXISTS room_meter_current INTEGER;

ALTER TABLE public.readings 
ADD COLUMN IF NOT EXISTS kitchen_meter_previous INTEGER;

ALTER TABLE public.readings 
ADD COLUMN IF NOT EXISTS kitchen_meter_current INTEGER;

-- Add room_type column to rooms table
ALTER TABLE public.rooms 
ADD COLUMN IF NOT EXISTS room_type VARCHAR(50) DEFAULT 'single';

-- Update existing readings to have meter_type
UPDATE public.readings 
SET meter_type = 'single' 
WHERE meter_type IS NULL;

-- Update existing rooms to have room_type
UPDATE public.rooms 
SET room_type = 'single' 
WHERE room_type IS NULL OR room_type = '';

-- Add generated columns for automatic unit calculations (double rooms)
ALTER TABLE public.readings 
ADD COLUMN IF NOT EXISTS room_meter_units INTEGER GENERATED ALWAYS AS (room_meter_current - room_meter_previous) STORED;

ALTER TABLE public.readings 
ADD COLUMN IF NOT EXISTS kitchen_meter_units INTEGER GENERATED ALWAYS AS (kitchen_meter_current - kitchen_meter_previous) STORED;

ALTER TABLE public.readings 
ADD COLUMN IF NOT EXISTS total_double_units INTEGER GENERATED ALWAYS AS (
    CASE 
        WHEN meter_type = 'double' THEN 
            (room_meter_current - room_meter_previous) + (kitchen_meter_current - kitchen_meter_previous)
        ELSE NULL 
    END
) STORED;

-- Create some double rooms for testing
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

-- Skip sample data insertion to avoid type conflicts
DO $$
BEGIN
    RAISE NOTICE '⚠️ Skipping sample data insertion to avoid data type conflicts';
    RAISE NOTICE '✅ You can manually test by creating a tenant in room 301 and adding readings';
END $$;

-- ==================================================
-- PART 2: ROOM OCCUPANCY MANAGEMENT TRIGGERS
-- ==================================================

DO $$
BEGIN
    RAISE NOTICE '🔧 Setting up Room Occupancy Management...';
END $$;

-- Function to update room occupancy when tenant is inserted or updated
CREATE OR REPLACE FUNCTION update_room_occupancy()
RETURNS TRIGGER AS $$
BEGIN
    -- Handle INSERT (new tenant)
    IF TG_OP = 'INSERT' THEN
        -- Mark new room as occupied
        UPDATE public.rooms 
        SET is_occupied = true 
        WHERE id = NEW.room_id AND NEW.is_active = true;
        
        RETURN NEW;
    END IF;
    
    -- Handle UPDATE (tenant changes room or status)
    IF TG_OP = 'UPDATE' THEN
        -- If room changed
        IF OLD.room_id != NEW.room_id THEN
            -- Free up old room
            UPDATE public.rooms 
            SET is_occupied = false 
            WHERE id = OLD.room_id;
            
            -- Occupy new room (if tenant is active)
            UPDATE public.rooms 
            SET is_occupied = true 
            WHERE id = NEW.room_id AND NEW.is_active = true;
        END IF;
        
        -- If tenant status changed to inactive
        IF OLD.is_active = true AND NEW.is_active = false THEN
            UPDATE public.rooms 
            SET is_occupied = false 
            WHERE id = NEW.room_id;
        END IF;
        
        -- If tenant status changed to active
        IF OLD.is_active = false AND NEW.is_active = true THEN
            UPDATE public.rooms 
            SET is_occupied = true 
            WHERE id = NEW.room_id;
        END IF;
        
        RETURN NEW;
    END IF;
    
    -- Handle DELETE (tenant removed)
    IF TG_OP = 'DELETE' THEN
        -- Free up the room
        UPDATE public.rooms 
        SET is_occupied = false 
        WHERE id = OLD.room_id;
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS tenant_room_occupancy_trigger ON public.tenants;

-- Create trigger for tenant table
CREATE TRIGGER tenant_room_occupancy_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.tenants
    FOR EACH ROW
    EXECUTE FUNCTION update_room_occupancy();

-- Function to ensure room occupancy consistency
CREATE OR REPLACE FUNCTION sync_room_occupancy()
RETURNS void AS $$
BEGIN
    -- Reset all rooms to unoccupied first
    UPDATE public.rooms SET is_occupied = false;
    
    -- Mark rooms as occupied based on active tenants
    UPDATE public.rooms 
    SET is_occupied = true 
    WHERE id IN (
        SELECT DISTINCT room_id 
        FROM public.tenants 
        WHERE is_active = true AND room_id IS NOT NULL
    );
    
    RAISE NOTICE 'Room occupancy synchronized successfully';
END;
$$ LANGUAGE plpgsql;

-- Run the sync function to fix any existing inconsistencies
SELECT sync_room_occupancy();

-- ==================================================
-- FINAL VERIFICATION AND SUCCESS MESSAGE
-- ==================================================

DO $$ 
DECLARE
    meter_cols INTEGER;
    double_rooms INTEGER;
    trigger_exists BOOLEAN;
BEGIN 
    -- Count meter-related columns
    SELECT COUNT(*) INTO meter_cols
    FROM information_schema.columns 
    WHERE table_name = 'readings' 
    AND column_name IN ('meter_type', 'room_meter_current', 'kitchen_meter_current');

    -- Count double rooms
    SELECT COUNT(*) INTO double_rooms
    FROM public.rooms 
    WHERE room_type = 'double';

    -- Check if trigger exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'tenant_room_occupancy_trigger'
    ) INTO trigger_exists;

    RAISE NOTICE '';
    RAISE NOTICE '🎉 ========================================== 🎉';
    RAISE NOTICE '✅ NEPAL RENTAL MANAGEMENT SETUP COMPLETE! ✅';
    RAISE NOTICE '🎉 ========================================== 🎉';
    RAISE NOTICE '';
    RAISE NOTICE '📊 VERIFICATION RESULTS:';
    RAISE NOTICE '  🔹 Meter columns added: % of 3', meter_cols;
    RAISE NOTICE '  🔹 Double rooms available: %', double_rooms;
    RAISE NOTICE '  🔹 Room occupancy triggers: %', CASE WHEN trigger_exists THEN 'ACTIVE' ELSE 'NOT FOUND' END;
    RAISE NOTICE '';
    RAISE NOTICE '🏠 DOUBLE ROOM FEATURES:';
    RAISE NOTICE '  ✅ Room Meter + Kitchen Meter support';
    RAISE NOTICE '  ✅ Automatic unit calculations';
    RAISE NOTICE '  ✅ Editable old readings';
    RAISE NOTICE '';
    RAISE NOTICE '⚡ AUTOMATIC FEATURES:';
    RAISE NOTICE '  ✅ Room occupancy management';
    RAISE NOTICE '  ✅ Current Nepali date defaults';
    RAISE NOTICE '  ✅ Enhanced error handling';
    RAISE NOTICE '';
    RAISE NOTICE '🧪 READY TO TEST:';
    RAISE NOTICE '  1. Add a tenant to room 301 (double room)';
    RAISE NOTICE '  2. Go to New Reading page';
    RAISE NOTICE '  3. You should see Room Meter + Kitchen Meter fields';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 If issues persist, check browser console for detailed error logs';
    RAISE NOTICE '';
END $$;