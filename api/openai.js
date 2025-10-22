// api/openai.js
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { action, text } = req.body;
    const apiKey = process.env.OPENAI_API_KEY;
    const model = "gpt-4o-mini";

    if (!apiKey) {
      return res.status(500).json({ error: "Missing OpenAI API key" });
    }

    const systemMap = {
      summarize: "Summarize student notes in 3-5 clear bullet points.",
      quiz: "Create exactly 3 quiz questions with short answers. Output JSON: [{q, a}].",
    };
    const system = systemMap[action] || systemMap.summarize;

    const userPrompt =
      action === "quiz"
        ? `Create 3 short quiz questions with answers from this text:\n${text}`
        : `Summarize this text in 3 bullet points for a student:\n${text}`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.2,
      }),
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim() || "";
    res.status(200).json({ content });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
