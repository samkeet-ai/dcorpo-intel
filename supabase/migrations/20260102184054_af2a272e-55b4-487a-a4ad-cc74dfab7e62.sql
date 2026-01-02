-- Grant admin role to existing admin user (email-based initial setup)
-- This is a one-time migration to ensure the admin has proper database role
-- after removing the hardcoded email bypass
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'sam.doshi007@gmail.com'
ON CONFLICT DO NOTHING;