-- Migration script to update existing database for Nepali date support
-- Run this in Supabase SQL Editor if you already have data and don't want to recreate tables

-- Add Nepali date columns to tenants table
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS move_in_date_nepali VARCHAR(20),
ADD COLUMN IF NOT EXISTS move_out_date_nepali VARCHAR(20);

-- Make move_in_date optional (remove NOT NULL constraint)
ALTER TABLE public.tenants ALTER COLUMN move_in_date DROP NOT NULL;

-- Add Nepali date columns to readings table
ALTER TABLE public.readings 
ADD COLUMN IF NOT EXISTS reading_date_nepali VARCHAR(20);

-- Add Nepali date columns to bills table
ALTER TABLE public.bills 
ADD COLUMN IF NOT EXISTS bill_date_nepali VARCHAR(20);

-- Add Nepali date columns to payments table
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS payment_date_nepali VARCHAR(20);

-- Success message
DO $$ 
BEGIN 
    RAISE NOTICE '✅ Database Migration Complete!';
    RAISE NOTICE '📊 Added Nepali date support to all tables';
    RAISE NOTICE '🏠 Made move_in_date optional in tenants table';
    RAISE NOTICE '🚀 Your app will now work without errors!';
END $$;