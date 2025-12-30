-- Create weekly_briefs table for the legal intel hub
CREATE TABLE public.weekly_briefs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  cover_image TEXT,
  publish_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  deep_dive_text TEXT,
  fun_fact TEXT,
  radar_points JSONB DEFAULT '[]'::jsonb,
  jargon_term TEXT,
  jargon_def TEXT,
  audio_summary_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.weekly_briefs ENABLE ROW LEVEL SECURITY;

-- Public read policy for active briefs (this is a public knowledge hub)
CREATE POLICY "Anyone can view active briefs" 
ON public.weekly_briefs 
FOR SELECT 
USING (status = 'active' AND publish_date <= now());

-- Create index for faster queries
CREATE INDEX idx_weekly_briefs_status_date ON public.weekly_briefs(status, publish_date DESC);

-- Insert sample data
INSERT INTO public.weekly_briefs (
  title,
  cover_image,
  publish_date,
  status,
  deep_dive_text,
  fun_fact,
  radar_points,
  jargon_term,
  jargon_def
) VALUES (
  'DPDPA Phase 1 Begins: What Your Business Needs to Know',
  'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1200&h=600&fit=crop',
  now(),
  'active',
  E'The Digital Personal Data Protection Act (DPDPA) 2023 marks India''s most significant privacy legislation to date. As Phase 1 comes into effect, businesses must understand their new obligations.\n\n**Key Compliance Requirements:**\n\n1. **Data Fiduciary Obligations**: Organizations processing personal data must now implement clear consent mechanisms. This means no more pre-ticked boxes or buried privacy policies.\n\n2. **Data Principal Rights**: Individuals now have the right to access, correct, and erase their personal data. Your systems must be ready to handle these requests within prescribed timelines.\n\n3. **Cross-Border Data Transfers**: While the government hasn''t yet released the list of restricted countries, businesses should audit their data flows now.\n\n**Immediate Action Items:**\n\n- Conduct a data mapping exercise\n- Update privacy policies and consent forms\n- Establish a grievance redressal mechanism\n- Train your team on new compliance requirements\n\nThe penalty framework is substantial—up to ₹250 crore for serious violations. However, the phased approach gives businesses time to adapt. Start your compliance journey today.',
  '🎯 The DPDPA was passed in just 3 parliamentary sessions—making it one of the fastest major legislations in Indian history!',
  '["🇪🇺 EU AI Act enforcement begins with first penalties expected Q2 2025", "🇺🇸 SEC proposes new cybersecurity disclosure rules for public companies", "🇸🇬 Singapore updates PDPA with stricter cross-border transfer rules"]',
  'Data Fiduciary',
  'An organization that determines the purpose and means of processing personal data. Think of them as the "data decision-makers" who are responsible for how your information is used.'
);