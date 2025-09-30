-- FIX NOT NULL CONSTRAINTS - This is the actual issue!
-- The previous_reading column has a NOT NULL constraint but should allow NULL for double rooms
-- Copy and paste this into Supabase SQL Editor

-- Remove NOT NULL constraint from previous_reading column
ALTER TABLE public.readings 
ALTER COLUMN previous_reading DROP NOT NULL;

-- Remove NOT NULL constraint from current_reading column (just in case)
ALTER TABLE public.readings 
ALTER COLUMN current_reading DROP NOT NULL;

-- Verify the fix
SELECT 'CONSTRAINT CHECK:' as info;
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    CASE WHEN is_nullable = 'YES' THEN '✅ CAN BE NULL' ELSE '❌ NOT NULL CONSTRAINT' END as constraint_status
FROM information_schema.columns 
WHERE table_name = 'readings' 
AND column_name IN ('previous_reading', 'current_reading', 'room_meter_current', 'kitchen_meter_current')
ORDER BY column_name;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 =============================================== 🎉';
    RAISE NOTICE '✅ NOT NULL CONSTRAINT ISSUE FIXED! ✅';
    RAISE NOTICE '🎉 =============================================== 🎉';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 CHANGES MADE:';
    RAISE NOTICE '  ✅ previous_reading can now be NULL (for double rooms)';
    RAISE NOTICE '  ✅ current_reading can now be NULL (for double rooms)';
    RAISE NOTICE '';
    RAISE NOTICE '🧪 READY TO TEST:';
    RAISE NOTICE '  1. Go back to your New Reading page';
    RAISE NOTICE '  2. Select Samyurta G.C. (in double room)';
    RAISE NOTICE '  3. Fill in Room Meter and Kitchen Meter readings';
    RAISE NOTICE '  4. Click Save - it should work now!';
    RAISE NOTICE '';
    RAISE NOTICE '💡 EXPLANATION:';
    RAISE NOTICE '  - Single rooms use: previous_reading + current_reading';
    RAISE NOTICE '  - Double rooms use: room_meter_* + kitchen_meter_*';
    RAISE NOTICE '  - The app correctly sets unused fields to NULL';
    RAISE NOTICE '  - Database now allows this logic!';
    RAISE NOTICE '';
END $$;