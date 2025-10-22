// api/openai.js  (only the flashcards return path is important)
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { action = "summarize", text = "" } = req.body || {};
    const apiKey = process.env.OPENAI_API_KEY;
    const model = "gpt-4o-mini";

    if (!text.trim()) return res.status(400).json({ error: "Missing 'text' input" });

    // For summarize/quiz/flashcards we still try the model if we have a key
    // If no key and action === flashcards, we'll return a fallback below.
    if (!apiKey && action !== "flashcards") {
      return res.status(500).json({ error: "Missing OPENAI_API_KEY" });
    }

    // Build system/user prompts
    const SYSTEM =
      action === "quiz"
        ? `You generate EXACTLY 3 short quiz Q&As. Return ONLY this JSON array:
[{"q":"Question 1","a":"Answer 1"},{"q":"Question 2","a":"Answer 2"},{"q":"Question 3","a":"Answer 3"}]`
        : action === "flashcards"
        ? `Create 4 helpful study flashcards for a student. Return ONLY JSON:
[{"front":"...","back":"..."}, ...]`
        : action === "explain"
        ? "Explain simply in 3–4 bullets. No code fences."
        : "Summarize notes into 3–5 short bullets. No code fences.";

    const USER =
      action === "quiz"
        ? `Text for quiz:\n${text}`
        : action === "flashcards"
        ? `Make 4 front/back flashcards from this note:\n${text}`
        : action === "explain"
        ? `Explain simply:\n${text}`
        : `Summarize for a student:\n${text}`;

    let content = "";

    // Try the OpenAI call when we have a key
    if (apiKey) {
      const r = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
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
        // If flashcards and model failed, we’ll still fallback
        if (action !== "flashcards") {
          const t = await r.text();
          return res.status(r.status).json({ error: t });
        }
      } else {
        const data = await r.json();
        content = data?.choices?.[0]?.message?.content?.trim() || "";
      }
    }

    const strip = (s = "") => s.replace(/```json|```/gi, "").trim();

    // ----- Normalize JSON outputs -----
    if (action === "quiz") {
      let parsed;
      try { parsed = JSON.parse(strip(content)); } catch { parsed = []; }
      if (!Array.isArray(parsed)) parsed = [];
      parsed = parsed.map(x => ({
        q: typeof x?.q === "string" ? x.q : String(x?.q ?? ""),
        a: typeof x?.a === "string" ? x.a : String(x?.a ?? ""),
      })).slice(0, 3);
      while (parsed.length < 3) parsed.push({ q: "", a: "" });
      return res.status(200).json({ content: JSON.stringify(parsed) });
    }

    if (action === "flashcards") {
      let parsed;
      try { parsed = JSON.parse(strip(content)); } catch { parsed = []; }
      if (!Array.isArray(parsed)) parsed = [];

      parsed = parsed.map(x => ({
        front: typeof x?.front === "string" ? x.front : String(x?.front ?? ""),
        back:  typeof x?.back  === "string" ? x.back  : String(x?.back  ?? ""),
      })).slice(0, 4);

      // ✅ Fallback if model failed / empty / no key
      if (parsed.length === 0) {
        parsed = [
          { front: "What is the main idea of this note?", back: "This is a fallback card shown when AI returns nothing." },
          { front: "One key fact?", back: "Add more detail to your note or try again to get better cards." }
        ];
      }

      return res.status(200).json({ content: JSON.stringify(parsed) });
    }

    // summarize / explain
    if (action === "summarize" || action === "explain") {
      content = strip(content).replace(/^\s*[-•*]\s*/gm, "• ");
      return res.status(200).json({ content });
    }

    return res.status(200).json({ content });
  } catch (err) {
    return res.status(500).json({ error: err.message || String(err) });
  }
}
