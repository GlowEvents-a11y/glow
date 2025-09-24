// api/chat.js — Vercel Serverless Function
export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    return res.status(200).end();
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { message } = req.body || {};
    if (!message) return res.status(400).json({ error: 'Missing message' });

   // const system = [
   //   "You are the Glow Events assistant for a balloon decoration & event styling company.",
   //   "Be concise, friendly, and specific. If unsure, ask for date, city, guest count, and venue.",
   //   "Offer ranges only when asked. Never reveal secrets or API keys."
  //  ].join('\n');

  const system = `
You are the Glow Events assistant — imagine you’re a warm, professional event planner.  
- Be personable and conversational, not robotic.  
- Use short, natural sentences (like you’re chatting).  
- Sprinkle in a friendly emoji now and then 🎉 (but don’t overdo it).  
- If the customer’s question is unclear, ask a polite follow-up.  
- If you don’t know exact details (e.g., pricing), invite them to request a formal quote.  
- Always keep responses helpful, upbeat, and on-brand.  
`;

// const payload = {
//  model: "gpt-4o",
//  temperature: 0.7,
//  messages: [
//    { role: "system", content: system },
//    { role: "user", content: `User: ${message}\n\nCompany Facts:\n${companyFacts}` }
//  ]
//};

    const companyFacts = `
Brand: Glow Events
Service Areas: Tri-state area + nearby
Typical Services: balloon garlands, backdrops, arches, corporate activations, birthdays, weddings
Lead Time: Prefer 10–14 days; rush may be available
Working Hours: Mon–Sat 9am–6pm
Contact: glowevents250@gmail.com
Contact: 9292883841
`.trim();

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.2,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: `User: ${message}\n\nCompany Facts:\n${companyFacts}` }
        ]
      })
    });

    if (!r.ok) {
      const text = await r.text();
      return res.status(500).json({ error: 'LLM error', details: text });
    }
    const data = await r.json();
    const reply = data?.choices?.[0]?.message?.content ?? "Sorry, I couldn't find an answer.";
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json({ reply });
  } catch (e) {
    res.status(500).json({ error: 'Server error', details: String(e) });
  }
}
