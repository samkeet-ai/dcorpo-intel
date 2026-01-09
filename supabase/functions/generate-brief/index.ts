import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    console.log(">>> RAG FUNCTION v4.0 STARTING");
    const { topic } = await req.json().catch(() => ({ topic: null }));
    
    // Auth Check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Authorization header");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) throw new Error("Unauthorized");

    // Search Tavily
    const TAVILY_API_KEY = Deno.env.get("TAVILY_API_KEY");
    if (!TAVILY_API_KEY) throw new Error("TAVILY_API_KEY missing");

    const searchTopic = topic && topic.trim().length > 2 ? topic : "latest legal tech news India EU USA";
    console.log(`Searching: ${searchTopic}`);

    const searchResponse = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query: searchTopic,
        search_depth: "advanced",
        include_answer: true,
        max_results: 5
      })
    });

    const searchData = await searchResponse.json();
    const context = searchData.results?.map((r: any) => `- ${r.title}: ${r.content}`).join("\n") || "No news found.";

    // Generate with Gemini
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY missing");

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro", generationConfig: { responseMimeType: "application/json" } });

    const prompt = `Role: Legal Consultant. 
    Context: ${context}
    Task: Write a brief about "${searchTopic}".
    Output JSON: { "title": "Headline", "content": "Markdown article with citations", "category": "Legal Tech" }`;

    const result = await model.generateContent(prompt);
    const briefData = JSON.parse(result.response.text());

    // Save
    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
    const { data, error } = await supabaseAdmin.from("legal_briefs").insert({
      title: briefData.title,
      content: briefData.content,
      category: briefData.category || "Legal Tech",
      is_published: false,
      author_id: user.id,
    }).select().single();

    if (error) throw error;
    console.log("Brief created:", data.id);
    return new Response(JSON.stringify({ success: true, brief: data }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error: any) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
