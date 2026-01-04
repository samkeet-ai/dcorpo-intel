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
  console.log("=== GENERATE-BRIEF FUNCTION CALLED (NO AUTH - DEBUG MODE) ===");
  console.log("Request Method:", req.method);

  // Handle CORS preflight requests FIRST
  if (req.method === "OPTIONS") {
    console.log("Handling OPTIONS preflight request");
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    // Get Gemini API key
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY is not configured");
      return new Response(JSON.stringify({ error: "GEMINI_API_KEY is not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("GEMINI_API_KEY found, proceeding with generation...");

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

    console.log("Calling Gemini API...");
    const result = await model.generateContent(prompt);
    const response = result.response;
    const content = response.text();

    if (!content) {
      throw new Error("No content in Gemini response");
    }

    console.log("Gemini Response received, parsing JSON...");

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

    // Initialize Supabase client (using service role for DB insert since no user auth)
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase environment variables");
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Insert brief into database
    console.log("Inserting brief into database...");
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

    console.log("Brief created successfully:", data.id);
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
