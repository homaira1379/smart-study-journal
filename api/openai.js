// api/openai.js
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { action = "summarize", text = "" } = req.body || {};
    const apiKey = process.env.OPENAI_API_KEY;
    const model = "gpt-4o-mini"; // adjust if you prefer a different model

    if (!apiKey) {
      return res.status(500).json({ error: "Missing OPENAI_API_KEY" });
    }
    if (!text.trim()) {
      return res.status(400).json({ error: "Missing 'text' input" });
    }

    // --- Prompts ---
    const SYSTEM = {
      summarize:
        "You are a study assistant. Summarize student notes into 3–5 short, clear bullet points. Do NOT add code fences.",
      explain:
        "You are a study assistant. Explain the concept simply in 3–4 short bullets. Do NOT add code fences.",
      quiz:
        // Ask for JSON only; no code fences; no commentary
        `You are a study assistant. Create EXACTLY 3 short quiz questions with brief answers.
Return ONLY a compact JSON array with this shape (no code fences, no extra text):
[
  {"q": "Question 1", "a": "Answer 1"},
  {"q": "Question 2", "a": "Answer 2"},
  {"q": "Question 3", "a": "Answer 3"}
]`,
    }[action] || "You are a helpful study assistant.";

    const USER =
      action === "quiz"
        ? `Text to quiz:\n${text}`
        : action === "explain"
        ? `Explain simply:\n${text}`
        : `Summarize for a student:\n${text}`;

    // --- Call OpenAI ---
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: USER },
        ],
      }),
    });

    if (!r.ok) {
      const t = await r.text();
      return res.status(r.status).json({ error: t });
    }

    const data = await r.json();
    let content = data?.choices?.[0]?.message?.content?.trim() || "";

    // --- Post-process to guarantee clean output ---
    const stripCodeFences = (s = "") =>
      s.replace(/```json|```/gi, "").trim();

    if (action === "quiz") {
      // 1) Expect a JSON array; try parse strictly
      let parsed;
      const cleaned = stripCodeFences(content);
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        // 2) Fallback: try to salvage from lines
        const lines = cleaned
          .split(/\r?\n/)
          .map((x) => x.trim())
          .filter(Boolean);

        const items = [];
        // simple heuristic: pair up lines into q/a when possible
        for (let i = 0; i < lines.length && items.length < 3; i++) {
          const q = lines[i]
            .replace(/^\d+[\).\s-]?\s*/g, "")
            .replace(/^[-*]\s*/g, "")
            .replace(/^q(uestion)?[:\s-]*/i, "")
            .trim();
          const next = lines[i + 1] || "";
          const a = next.replace(/^ans(wer)?[:\s-]*/i, "").trim();
          if (q && a) {
            items.push({ q, a });
            i++;
          } else if (q) {
            items.push({ q, a: "" });
          }
        }
        parsed = items.slice(0, 3);
      }

      // 3) Final guard: ensure it’s exactly 3 with q/a strings
      if (!Array.isArray(parsed)) parsed = [];
      parsed = parsed
        .map((x) => ({
          q: typeof x?.q === "string" ? x.q : String(x?.q ?? ""),
          a: typeof x?.a === "string" ? x.a : String(x?.a ?? ""),
        }))
        .slice(0, 3);

      // If fewer than 3, pad with blanks (optional)
      while (parsed.length < 3) parsed.push({ q: "", a: "" });

      // Return as a JSON string so the current frontend can parse it
      return res.status(200).json({ content: JSON.stringify(parsed) });
    }

    // summarize / explain -> remove any list markers but keep line breaks;
    // frontend will render as bullets
    if (action === "summarize" || action === "explain") {
      content = stripCodeFences(content).replace(/^\s*[-•*]\s*/gm, "");
      return res.status(200).json({ content });
    }

    // default: pass through
    return res.status(200).json({ content });
  } catch (err) {
    return res.status(500).json({ error: err.message || String(err) });
  }
}
