// src/components/NoteList.jsx
import { useState } from "react";

/* Tiny inline spinner (no CSS file needed) */
function Spinner({ size = 16 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 50 50"
      aria-label="Loading"
      role="img"
      style={{ verticalAlign: "middle" }}
    >
      <circle
        cx="25"
        cy="25"
        r="20"
        fill="none"
        stroke="currentColor"
        strokeWidth="6"
        strokeOpacity="0.2"
      />
      <path fill="currentColor" d="M25 5 a20 20 0 0 1 20 20">
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0 25 25"
          to="360 25 25"
          dur="0.8s"
          repeatCount="indefinite"
        />
      </path>
    </svg>
  );
}

/* Helpers to clean/format AI output */
function stripCodeFences(text = "") {
  return text.replace(/```json|```/gi, "").trim();
}

function tryParseQuiz(content) {
  // 1) remove ```json fences if present, then parse
  const clean = stripCodeFences(content);
  try {
    const parsed = JSON.parse(clean);
    if (Array.isArray(parsed)) return parsed;
  } catch {}
  // 2) fallback: try to detect bullet/numbered lines
  const lines = clean.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  // group pairs "Q: ..." / "A: ..." into {q,a}
  const qa = [];
  for (let i = 0; i < lines.length; i++) {
    const q = lines[i].replace(/^\d+[\).\s-]?\s*/,'').replace(/^[-*]\s*/,'');
    const a = lines[i + 1]?.replace(/^ans(wer)?[:\s-]*/i, "");
    if (/^q(uestion)?[:\s-]/i.test(lines[i]) && a) {
      qa.push({ q: q.replace(/^q(uestion)?[:\s-]*/i, ""), a });
      i++;
    } else if (q) {
      qa.push({ q, a: "" });
    }
  }
  return qa.slice(0, 3);
}

function bulletsFromText(text = "") {
  const clean = stripCodeFences(text);
  // split on lines, remove leading list markers
  return clean
    .split(/\r?\n/)
    .map((s) => s.replace(/^[\s*-•]+/, "").trim())
    .filter(Boolean);
}

export default function NoteList({ notes, onEdit, onDelete }) {
  const [loadingId, setLoadingId] = useState(null);
  const [summaries, setSummaries] = useState({});
  const [quizzes, setQuizzes] = useState({});

  if (!notes.length) return <p>No notes yet. Create your first note above!</p>;

  async function callAI(action, note) {
    setLoadingId(note.id);
    try {
      const res = await fetch("/api/openai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, text: note.content }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "AI request failed");

      if (action === "summarize" || action === "explain") {
        setSummaries((prev) => ({ ...prev, [note.id]: data.content }));
      } else if (action === "quiz") {
        setQuizzes((prev) => ({ ...prev, [note.id]: data.content }));
      }
    } catch (err) {
      alert("AI error: " + err.message);
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      {notes.map((n) => {
        const isLoading = loadingId === n.id;
        const summaryBullets = summaries[n.id] ? bulletsFromText(summaries[n.id]) : null;
        const quizArray = quizzes[n.id] ? tryParseQuiz(quizzes[n.id]) : null;

        return (
          <div
            key={n.id}
            style={{
              background: "#f8fafc",
              border: "1px solid #e5e7eb",
              borderRadius: "12px",
              padding: "1rem",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", gap: ".75rem" }}>
              <div>
                <strong style={{ fontSize: "1.05rem" }}>{n.title || "Untitled"}</strong>{" "}
                <span style={{ color: "#64748b", fontSize: ".85rem" }}>
                  {new Date(n.date).toLocaleString()}
                </span>
                {n.subject && (
                  <span
                    style={{
                      marginLeft: ".5rem",
                      fontSize: ".75rem",
                      background: "#eef2ff",
                      color: "#3730a3",
                      padding: ".15rem .5rem",
                      borderRadius: "999px",
                    }}
                  >
                    {n.subject}
                  </span>
                )}
              </div>

              <div style={{ display: "flex", gap: ".4rem", alignItems: "center", flexWrap: "wrap" }}>
                <button
                  onClick={() => callAI("summarize", n)}
                  disabled={isLoading}
                  title="Generate a short summary"
                  style={{
                    padding: ".4rem .8rem",
                    borderRadius: "8px",
                    border: "1px solid #2563eb",
                    background: "transparent",
                    color: "#2563eb",
                    cursor: isLoading ? "not-allowed" : "pointer",
                  }}
                >
                  🧠 Summarize
                </button>
                <button
                  onClick={() => callAI("quiz", n)}
                  disabled={isLoading}
                  title="Create 3 quiz questions"
                  style={{
                    padding: ".4rem .8rem",
                    borderRadius: "8px",
                    border: "1px solid #16a34a",
                    background: "transparent",
                    color: "#16a34a",
                    cursor: isLoading ? "not-allowed" : "pointer",
                  }}
                >
                  ❓ Quiz
                </button>
                {onEdit && (
                  <button
                    onClick={() => onEdit(n.id)}
                    style={{
                      padding: ".4rem .8rem",
                      borderRadius: "8px",
                      border: "1px solid #f59e0b",
                      background: "transparent",
                      color: "#b45309",
                      cursor: "pointer",
                    }}
                  >
                    ✏️ Edit
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => onDelete(n.id)}
                    style={{
                      padding: ".4rem .8rem",
                      borderRadius: "8px",
                      border: "1px solid #ef4444",
                      background: "transparent",
                      color: "#ef4444",
                      cursor: "pointer",
                    }}
                  >
                    🗑️ Delete
                  </button>
                )}

                {isLoading && (
                  <span style={{ display: "inline-flex", gap: ".4rem", alignItems: "center", color: "#6b7280" }}>
                    <Spinner /> <span>AI working…</span>
                  </span>
                )}
              </div>
            </div>

            {/* Content */}
            <div style={{ marginTop: ".5rem", whiteSpace: "pre-wrap" }}>{n.content}</div>

            {/* AI Summary */}
            {summaryBullets && summaryBullets.length > 0 && (
              <div
                style={{
                  marginTop: ".75rem",
                  padding: ".75rem",
                  background: "#ffffff",
                  border: "1px dashed #cbd5e1",
                  borderRadius: "10px",
                }}
              >
                <strong>AI Summary</strong>
                <ul style={{ marginTop: ".4rem", paddingLeft: "1.1rem" }}>
                  {summaryBullets.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* AI Quiz */}
            {quizArray && quizArray.length > 0 && (
              <div
                style={{
                  marginTop: ".75rem",
                  padding: ".75rem",
                  background: "#ffffff",
                  border: "1px dashed #a7f3d0",
                  borderRadius: "10px",
                }}
              >
                <strong>Quiz</strong>
                <ol style={{ marginTop: ".4rem", paddingLeft: "1.1rem" }}>
                  {quizArray.map((qa, i) => (
                    <li key={i} style={{ marginBottom: ".35rem" }}>
                      {qa.q}
                      {qa.a ? (
                        <div style={{ color: "#065f46", marginTop: ".15rem" }}>→ {qa.a}</div>
                      ) : null}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
