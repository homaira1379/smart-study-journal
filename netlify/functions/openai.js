// netlify/functions/openai.js
export default async (req) => {
  try {
    const { action, text } = await req.json();
    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Missing OPENAI_API_KEY" }), { status: 500 });
    }

    const systemMap = {
      summarize: "You summarize student notes in 3-5 concise bullets.",
      quiz: "You generate exactly 3 short quiz questions with brief answers. Output JSON: [{q:string,a:string}]",
      explain: "Explain complex concepts simply in 3-4 bullets.",
    };
    const system = systemMap[action] || systemMap.summarize;

    const userPrompt =
      action === "quiz"
        ? `Create 3 short quiz questions with answers from this text. Return JSON array only. Text:\n${text}`
        : action === "explain"
        ? `Explain this concept in simple terms in 3-4 bullets. Text:\n${text}`
        : `Summarize this text in 3 bullet points for a student. Text:\n${text}`;

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.2,
      }),
    });

    if (!r.ok) {
      const t = await r.text();
      return new Response(JSON.stringify({ error: t }), { status: r.status });
    }
    const data = await r.json();
    const content = data.choices?.[0]?.message?.content?.trim() || "";
    return new Response(JSON.stringify({ content }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || String(err) }), { status: 500 });
  }
};
