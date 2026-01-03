-- Fix weekly_briefs RLS policies to require admin role for all privileged operations

-- Drop the overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can view all briefs" ON public.weekly_briefs;
DROP POLICY IF EXISTS "Authenticated users can insert briefs" ON public.weekly_briefs;
DROP POLICY IF EXISTS "Authenticated users can update briefs" ON public.weekly_briefs;
DROP POLICY IF EXISTS "Authenticated users can delete briefs" ON public.weekly_briefs;

-- Create admin-only policies for viewing all briefs (including drafts)
CREATE POLICY "Admins can view all briefs"
  ON public.weekly_briefs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Create admin-only policies for modifications
CREATE POLICY "Admins can insert briefs"
  ON public.weekly_briefs FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update briefs"
  ON public.weekly_briefs FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete briefs"
  ON public.weekly_briefs FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- The existing "Anyone can view active briefs" policy remains for public access to published content