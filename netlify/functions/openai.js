// api/openai.js
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { action = "summarize", text = "" } = req.body || {};
    const apiKey = process.env.OPENAI_API_KEY;
    const model = "gpt-4o-mini";

    if (!apiKey) return res.status(500).json({ error: "Missing OPENAI_API_KEY" });
    if (!text.trim()) return res.status(400).json({ error: "Missing 'text' input" });

    const SYSTEM =
      action === "quiz"
        ? `You generate EXACTLY 3 short quiz questions with brief answers.
Return ONLY a compact JSON array like:
[
  {"q":"Question 1","a":"Answer 1"},
  {"q":"Question 2","a":"Answer 2"},
  {"q":"Question 3","a":"Answer 3"}
]
No code fences.`
        : action === "flashcards"
        ? `You create 4 concise study flashcards.
Return ONLY JSON array with objects: [{"front":"…","back":"…"}] (length 4). No commentary, no code fences. Front is the prompt. Back is the answer.`
        : action === "explain"
        ? "Explain the concept simply in 3–4 short bullets. No code fences."
        : "Summarize student notes into 3–5 short bullets. No code fences.";

    const USER =
      action === "quiz"
        ? `Text for quiz:\n${text}`
        : action === "flashcards"
        ? `Make 4 front/back cards from this note:\n${text}`
        : action === "explain"
        ? `Explain simply:\n${text}`
        : `Summarize for a student:\n${text}`;

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
      const t = await r.text();
      return res.status(r.status).json({ error: t });
    }

    const data = await r.json();
    let content = data?.choices?.[0]?.message?.content?.trim() || "";

    const stripFences = (s = "") => s.replace(/```json|```/gi, "").trim();

    if (action === "quiz" || action === "flashcards") {
      let parsed;
      const cleaned = stripFences(content);
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        parsed = [];
      }

      if (!Array.isArray(parsed)) parsed = [];

      // Normalize shapes
      if (action === "quiz") {
        parsed = parsed
          .map((x) => ({
            q: typeof x?.q === "string" ? x.q : String(x?.q ?? ""),
            a: typeof x?.a === "string" ? x.a : String(x?.a ?? ""),
          }))
          .slice(0, 3);
        while (parsed.length < 3) parsed.push({ q: "", a: "" });
      } else {
        // flashcards
        parsed = parsed
          .map((x) => ({
            front: typeof x?.front === "string" ? x.front : String(x?.front ?? ""),
            back: typeof x?.back === "string" ? x.back : String(x?.back ?? ""),
          }))
          .slice(0, 4);
        while (parsed.length < 4) parsed.push({ front: "", back: "" });
      }

      return res.status(200).json({ content: JSON.stringify(parsed) });
    }

    // summarize / explain: clean bullet markers
    if (action === "summarize" || action === "explain") {
      content = stripFences(content).replace(/^\s*[-•*]\s*/gm, "");
      return res.status(200).json({ content });
    }

    return res.status(200).json({ content });
  } catch (err) {
    return res.status(500).json({ error: err.message || String(err) });
  }
}
