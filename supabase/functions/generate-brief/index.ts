import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // SECURITY: Verify JWT token from Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error("Missing or invalid Authorization header");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Authenticated user:", user.email);

    // SECURITY: Verify user has admin role - prevents non-admin users from consuming AI credits
    const { data: hasAdminRole, error: roleError } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (roleError || !hasAdminRole) {
      console.error("Admin check failed:", roleError);
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Admin access verified for:", user.email);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Generating new brief with AI...");

    const prompt = `You are a legal technology expert creating a weekly intelligence briefing. Today's date is ${new Date().toISOString().split('T')[0]}.

Generate a comprehensive legal-tech intelligence brief covering the latest developments in:
- Data privacy laws (GDPR, DPDPA, CCPA updates)
- AI regulations (EU AI Act, global AI governance)
- Cybersecurity compliance
- Corporate legal technology trends

Respond with a JSON object (no markdown, just valid JSON) with this exact structure:
{
  "title": "A compelling headline about the most important development this week (max 80 chars)",
  "deep_dive_text": "A detailed 400-word analysis of the key legal development. Use markdown formatting with **bold headers** and bullet points. Be specific about dates, jurisdictions, and implications.",
  "fun_fact": "A surprising or little-known fact about legal technology or regulations (2-3 sentences)",
  "radar_points": [
    "🇪🇺 Brief update about EU legal developments (1-2 sentences)",
    "🇮🇳 Brief update about India legal developments (1-2 sentences)",
    "🇺🇸 Brief update about US legal developments (1-2 sentences)"
  ],
  "jargon_term": "A complex legal/tech term to explain",
  "jargon_def": "A simple, clear definition that a non-lawyer can understand (2-3 sentences)",
  "linkedin_caption": "A professional LinkedIn post (max 280 chars) summarizing the brief with hashtags like #LegalTech #Compliance #DataPrivacy",
  "cover_image": "https://images.unsplash.com/photo-[VALID_UNSPLASH_ID]?w=1200&h=600&fit=crop"
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a legal technology expert. Always respond with valid JSON only, no markdown code blocks." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    console.log("AI Response received");

    let briefData;
    try {
      const cleanedContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      briefData = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      throw new Error("Failed to parse AI response as JSON");
    }

    if (!briefData.title || !briefData.deep_dive_text) {
      throw new Error("AI response missing required fields");
    }

    const coverImage = briefData.cover_image?.includes("unsplash.com") 
      ? briefData.cover_image 
      : "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1200&h=600&fit=crop";

    // Use service role key for database insert
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data, error } = await adminClient.from("weekly_briefs").insert({
      title: briefData.title,
      deep_dive_text: briefData.deep_dive_text,
      fun_fact: briefData.fun_fact || null,
      radar_points: JSON.stringify(briefData.radar_points || []),
      jargon_term: briefData.jargon_term || null,
      jargon_def: briefData.jargon_def || null,
      linkedin_caption: briefData.linkedin_caption || null,
      cover_image: coverImage,
      status: "draft",
      publish_date: new Date().toISOString(),
    }).select().single();

    if (error) {
      console.error("Database error:", error);
      throw error;
    }

    console.log("Brief created:", data.id);
    return new Response(JSON.stringify({ success: true, brief: data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error generating brief:", error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
