-- SIMPLE DATABASE CHECK - Run this first to see what's missing
-- Copy and paste this into Supabase SQL Editor

-- Check if readings table exists
SELECT 'READINGS TABLE EXISTS?' as check_name, 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'readings') 
            THEN 'YES' ELSE 'NO' END as result;

-- Check specific columns that are required for double room support
SELECT 'COLUMN EXISTENCE CHECK:' as info;

SELECT 
  'meter_type' as column_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'readings' AND column_name = 'meter_type'
  ) THEN 'EXISTS' ELSE 'MISSING' END as status
UNION ALL
SELECT 
  'room_meter_current' as column_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'readings' AND column_name = 'room_meter_current'
  ) THEN 'EXISTS' ELSE 'MISSING' END as status
UNION ALL
SELECT 
  'kitchen_meter_current' as column_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'readings' AND column_name = 'kitchen_meter_current'
  ) THEN 'EXISTS' ELSE 'MISSING' END as status
UNION ALL
SELECT 
  'room_meter_previous' as column_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'readings' AND column_name = 'room_meter_previous'
  ) THEN 'EXISTS' ELSE 'MISSING' END as status
UNION ALL
SELECT 
  'kitchen_meter_previous' as column_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'readings' AND column_name = 'kitchen_meter_previous'
  ) THEN 'EXISTS' ELSE 'MISSING' END as status;

-- Show ALL current columns in readings table
SELECT 'ALL READINGS TABLE COLUMNS:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'readings' AND table_schema = 'public'
ORDER BY column_name;

-- Check room_type column in rooms table
SELECT 'ROOM_TYPE CHECK:' as info;
SELECT 
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rooms' AND column_name = 'room_type'
  ) THEN 'room_type EXISTS in rooms table' ELSE 'room_type MISSING in rooms table' END as status;

-- Check if double rooms exist
SELECT 'DOUBLE ROOMS:' as info;
SELECT room_number, room_type 
FROM public.rooms 
WHERE room_type = 'double'
ORDER BY room_number;