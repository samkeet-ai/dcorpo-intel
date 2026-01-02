-- Drop the deprecated admin_settings table that contains plain text PIN codes
-- This table is no longer used since we migrated to Supabase Auth
DROP TABLE IF EXISTS public.admin_settings;
