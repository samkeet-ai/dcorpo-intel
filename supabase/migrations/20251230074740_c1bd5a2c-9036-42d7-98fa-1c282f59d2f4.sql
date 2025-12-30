-- Create the update_updated_at_column function first
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create admin_settings table to store configurable settings like PIN
CREATE TABLE public.admin_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  pin_code text NOT NULL DEFAULT '2025',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Only the owner can view their settings
CREATE POLICY "Users can view their own settings"
ON public.admin_settings
FOR SELECT
USING (auth.uid() = user_id);

-- Only the owner can update their settings
CREATE POLICY "Users can update their own settings"
ON public.admin_settings
FOR UPDATE
USING (auth.uid() = user_id);

-- Only authenticated users can insert their settings
CREATE POLICY "Authenticated users can create their settings"
ON public.admin_settings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Update trigger for updated_at
CREATE TRIGGER update_admin_settings_updated_at
BEFORE UPDATE ON public.admin_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Allow admin to manage all briefs (insert, update, delete) when authenticated
CREATE POLICY "Authenticated users can insert briefs"
ON public.weekly_briefs
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update briefs"
ON public.weekly_briefs
FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete briefs"
ON public.weekly_briefs
FOR DELETE
USING (auth.uid() IS NOT NULL);

-- Allow authenticated users to view all briefs (including drafts) in admin
CREATE POLICY "Authenticated users can view all briefs"
ON public.weekly_briefs
FOR SELECT
USING (auth.uid() IS NOT NULL);