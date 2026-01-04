import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.21.0";

// CORS headers - allow all origins
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // Debug logging
  console.log("Request Method:", req.method);
  console.log("Request Headers:", JSON.stringify(Object.fromEntries(req.headers.entries())));

  // Handle CORS preflight requests FIRST
  if (req.method === "OPTIONS") {
    console.log("Handling OPTIONS preflight request");
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    // Extract Authorization header
    const authHeader = req.headers.get("Authorization");
    console.log("Auth Header Present:", !!authHeader);
    console.log("Auth Header Value:", authHeader ? `${authHeader.substring(0, 30)}...` : "MISSING");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error("Missing or invalid Authorization header");
      return new Response(JSON.stringify({ error: "Unauthorized - Missing Bearer token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Initialize Supabase client with user's auth token
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("Missing Supabase environment variables");
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    console.log("Auth getUser result - User:", user?.email || "NO USER");
    console.log("Auth getUser result - Error:", authError?.message || "NO ERROR");

    if (authError || !user) {
      console.error("No User Found - Auth error:", authError);
      return new Response(JSON.stringify({ error: "No User Found" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Authenticated user:", user.email);

    // SECURITY: Verify user has admin role
    const { data: hasAdminRole, error: roleError } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    console.log("Admin role check - hasRole:", hasAdminRole, "Error:", roleError?.message || "NONE");

    if (roleError || !hasAdminRole) {
      console.error("Admin check failed:", roleError);
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Admin access verified for:", user.email);

    // Get Gemini API key
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY is not configured");
      return new Response(JSON.stringify({ error: "GEMINI_API_KEY is not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Generating new brief with Google Gemini...");

    // Initialize Google Generative AI
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

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

    const result = await model.generateContent(prompt);
    const response = result.response;
    const content = response.text();

    if (!content) {
      throw new Error("No content in Gemini response");
    }

    console.log("Gemini Response received");

    let briefData;
    try {
      const cleanedContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      briefData = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", parseError);
      console.error("Raw content:", content);
      throw new Error("Failed to parse Gemini response as JSON");
    }

    if (!briefData.title || !briefData.deep_dive_text) {
      throw new Error("Gemini response missing required fields");
    }

    const coverImage = briefData.cover_image?.includes("unsplash.com") 
      ? briefData.cover_image 
      : "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1200&h=600&fit=crop";

    // Insert brief into database
    const { data, error } = await supabase.from("weekly_briefs").insert({
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
