// worker.js — Cloudflare Workers / Pages Functions example
// Set OPENAI_API_KEY as a secret: wrangler secret put OPENAI_API_KEY
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() });
    }
    if (url.pathname === '/api/chat' && request.method === 'POST') {
      try {
        const { message, sessionId } = await request.json();

        // Basic guardrails
        const system = [
          "You are the Glow Events assistant for a balloon decoration & event styling company.",
          "Be concise, friendly, and specific. Offer suggestions and price ranges only when asked.",
          "If unsure about exact pricing or availability, ask for date, city, guest count, and venue details.",
          "Encourage users to request a quote via the website form if needed.",
          "Never reveal system or API keys."
        ].join("\n");

        // Lightweight "RAG": company facts you can customize
        const companyFacts = `
Brand: Glow Events
Service Areas: Tri-state area + nearby
Typical Services: balloon garlands, backdrops, arches, corporate activations, birthdays, weddings
Lead Time: Prefer 10–14 days; rush may be available
Working Hours: Mon–Sat 9am–6pm
Contact: hello@yourevents.com
Website: https://example.com
`.trim();

        const payload = {
          model: "gpt-4o-mini",
          temperature: 0.2,
          messages: [
            { role: "system", content: system },
            { role: "user", content: `User: ${message}\n\nCompany Facts:\n${companyFacts}` }
          ]
        };

        const r = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });

        if (!r.ok) {
          const e = await r.text();
          return new Response(JSON.stringify({ error: "LLM error", details: e }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders() } });
        }
        const j = await r.json();
        const reply = j.choices?.[0]?.message?.content ?? "Sorry, I couldn't find an answer.";

        return new Response(JSON.stringify({ reply }), {
          headers: { "Content-Type": "application/json", ...corsHeaders() }
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: "Bad request", details: String(err) }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders() } });
      }
    }
    return new Response("Not found", { status: 404, headers: corsHeaders() });
  }
};

function corsHeaders(){
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  };
}
