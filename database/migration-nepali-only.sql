-- Migration for Nepali-only dates system
-- Run this in Supabase SQL Editor to update existing database

-- Make English dates optional in readings table
ALTER TABLE public.readings ALTER COLUMN reading_date DROP NOT NULL;

-- Make English dates optional in bills table  
ALTER TABLE public.bills ALTER COLUMN bill_date DROP NOT NULL;

-- Make Nepali dates required in readings table
ALTER TABLE public.readings ALTER COLUMN reading_date_nepali SET NOT NULL;

-- Make Nepali dates required in bills table
ALTER TABLE public.bills ALTER COLUMN bill_date_nepali SET NOT NULL;

-- Update any existing readings with missing Nepali dates (if any)
UPDATE public.readings 
SET reading_date_nepali = '2081-01-01' 
WHERE reading_date_nepali IS NULL OR reading_date_nepali = '';

-- Update any existing bills with missing Nepali dates (if any)
UPDATE public.bills 
SET bill_date_nepali = '2081-01-01' 
WHERE bill_date_nepali IS NULL OR bill_date_nepali = '';

-- Success message
DO $$ 
BEGIN 
    RAISE NOTICE '✅ Nepali Date Migration Complete!';
    RAISE NOTICE '📅 English dates are now optional';
    RAISE NOTICE '🗓️ Nepali dates are now required and primary';
    RAISE NOTICE '🚀 Your app will now use only Nepali calendar system!';
END $$;