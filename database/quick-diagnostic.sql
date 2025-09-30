-- QUICK DIAGNOSTIC - Run this first to see what's missing
-- Copy and paste this into Supabase SQL Editor

-- Check if readings table exists
SELECT 'READINGS TABLE EXISTS?' as check_name, 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'readings') 
            THEN 'YES' ELSE 'NO' END as result;

-- List ALL columns in readings table
SELECT 'CURRENT READINGS COLUMNS:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'readings' AND table_schema = 'public'
ORDER BY column_name;

-- Check specifically for double room columns
SELECT 'DOUBLE ROOM COLUMNS CHECK:' as info;
SELECT 
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'readings' AND column_name = 'meter_type') 
         THEN '✅ meter_type EXISTS' ELSE '❌ meter_type MISSING' END as meter_type_status,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'readings' AND column_name = 'room_meter_current') 
         THEN '✅ room_meter_current EXISTS' ELSE '❌ room_meter_current MISSING' END as room_meter_status,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'readings' AND column_name = 'kitchen_meter_current') 
         THEN '✅ kitchen_meter_current EXISTS' ELSE '❌ kitchen_meter_current MISSING' END as kitchen_meter_status;

-- Check double rooms
SELECT 'DOUBLE ROOMS AVAILABLE:' as info;
SELECT room_number, room_type, monthly_rent 
FROM public.rooms 
WHERE room_type = 'double'
ORDER BY room_number;