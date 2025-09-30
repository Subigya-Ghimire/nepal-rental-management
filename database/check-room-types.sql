-- Check room types and tenant assignments
-- Run this to see if room types are set correctly

-- Check all rooms and their types
SELECT 'ALL ROOMS:' as info;
SELECT 
    room_number, 
    room_type,
    monthly_rent,
    is_occupied,
    CASE 
        WHEN room_type IS NULL THEN '❌ NULL room_type'
        WHEN room_type = '' THEN '❌ EMPTY room_type' 
        WHEN room_type = 'double' THEN '✅ DOUBLE room'
        WHEN room_type = 'single' THEN '✅ SINGLE room'
        ELSE '⚠️ UNKNOWN room_type'
    END as status
FROM public.rooms 
ORDER BY room_number;

-- Check tenants and their room assignments
SELECT 'TENANT ROOM ASSIGNMENTS:' as info;
SELECT 
    t.name as tenant_name,
    r.room_number,
    r.room_type,
    t.is_active
FROM public.tenants t
JOIN public.rooms r ON t.room_id = r.id
WHERE t.is_active = true
ORDER BY r.room_number;

-- Fix any rooms that have NULL or empty room_type
UPDATE public.rooms 
SET room_type = 'single' 
WHERE room_type IS NULL OR room_type = '';

-- Show the result after fixing
SELECT 'AFTER FIXING:' as info;
SELECT 
    room_number, 
    room_type,
    CASE 
        WHEN room_type = 'double' THEN '🏠 DOUBLE ROOM'
        WHEN room_type = 'single' THEN '🏠 SINGLE ROOM'
        ELSE '❌ UNKNOWN'
    END as type_status
FROM public.rooms 
ORDER BY room_number;