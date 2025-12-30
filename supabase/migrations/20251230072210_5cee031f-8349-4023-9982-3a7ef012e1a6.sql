-- Add linkedin_caption column to weekly_briefs
ALTER TABLE public.weekly_briefs 
ADD COLUMN IF NOT EXISTS linkedin_caption text;