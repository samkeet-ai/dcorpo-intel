
-- ================================================
-- SECURITY-FIRST DATABASE SCHEMA FOR LEGAL EAGLE INTEL
-- ================================================

-- 1. Create app_role enum for role-based access
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- 2. Create user_roles table for RBAC (prevents privilege escalation)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 4. RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Only admins can manage roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- ================================================
-- LEGAL BRIEFS TABLE
-- ================================================
CREATE TABLE public.legal_briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  author_id UUID REFERENCES auth.users(id)
);

ALTER TABLE public.legal_briefs ENABLE ROW LEVEL SECURITY;

-- Public can read published briefs
CREATE POLICY "Anyone can view published briefs"
  ON public.legal_briefs FOR SELECT
  USING (is_published = true);

-- Authenticated admins can view all briefs
CREATE POLICY "Admins can view all briefs"
  ON public.legal_briefs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can insert briefs
CREATE POLICY "Admins can insert briefs"
  ON public.legal_briefs FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can update briefs
CREATE POLICY "Admins can update briefs"
  ON public.legal_briefs FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete briefs
CREATE POLICY "Admins can delete briefs"
  ON public.legal_briefs FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_legal_briefs_updated_at
  BEFORE UPDATE ON public.legal_briefs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ================================================
-- SUBSCRIBERS TABLE (Enhanced)
-- ================================================
-- Add new columns to existing subscribers table
ALTER TABLE public.subscribers 
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS consent_log BOOLEAN NOT NULL DEFAULT true;

-- Drop existing policies and recreate with proper security
DROP POLICY IF EXISTS "Anyone can subscribe" ON public.subscribers;
DROP POLICY IF EXISTS "Users can view subscriptions" ON public.subscribers;

-- Public can only INSERT (subscribe)
CREATE POLICY "Public can subscribe"
  ON public.subscribers FOR INSERT
  WITH CHECK (true);

-- ONLY admins can SELECT subscribers (privacy protection)
CREATE POLICY "Only admins can view subscribers"
  ON public.subscribers FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ONLY admins can UPDATE subscribers
CREATE POLICY "Only admins can update subscribers"
  ON public.subscribers FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ONLY admins can DELETE subscribers
CREATE POLICY "Only admins can delete subscribers"
  ON public.subscribers FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ================================================
-- AUDIT LOGS TABLE (Security Tracking)
-- ================================================
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  admin_id UUID REFERENCES auth.users(id),
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can insert audit logs
CREATE POLICY "Admins can insert audit logs"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ================================================
-- FUNCTION TO LOG ADMIN ACTIONS
-- ================================================
CREATE OR REPLACE FUNCTION public.log_admin_action(
  _action TEXT,
  _details JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _log_id UUID;
BEGIN
  INSERT INTO public.audit_logs (action, admin_id, details)
  VALUES (_action, auth.uid(), _details)
  RETURNING id INTO _log_id;
  
  RETURN _log_id;
END;
$$;
