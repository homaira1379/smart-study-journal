// src/components/NoteList.jsx
import { useState } from "react";
import Flashcards from "./Flashcards";

/* Spinner remains the same */
function Spinner({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 50 50" role="img" aria-label="Loading" style={{ verticalAlign: "middle" }}>
      <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" strokeWidth="6" strokeOpacity="0.2" />
      <path fill="currentColor" d="M25 5 a20 20 0 0 1 20 20">
        <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="0.8s" repeatCount="indefinite" />
      </path>
    </svg>
  );
}

function stripCodeFences(text = "") {
  return text.replace(/```json|```/gi, "").trim();
}
function bulletsFromText(text = "") {
  const clean = stripCodeFences(text);
  return clean.split(/\r?\n/).map(s => s.replace(/^[\s*-•]+/, "").trim()).filter(Boolean);
}
function tryParseQuiz(content) {
  const clean = stripCodeFences(content);
  try {
    const parsed = JSON.parse(clean);
    if (Array.isArray(parsed)) return parsed;
  } catch {}
  return [];
}
function tryParseFlashcards(content) {
  const clean = stripCodeFences(content);
  try {
    const parsed = JSON.parse(clean);
    if (Array.isArray(parsed)) return parsed;
  } catch {}
  return [];
}

export default function NoteList({ notes, onEdit, onDelete }) {
  const [loadingId, setLoadingId] = useState(null);
  const [summaries, setSummaries] = useState({});
  const [quizzes, setQuizzes] = useState({});
  const [cards, setCards] = useState({}); // noteId -> [{front,back}]

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
        setSummaries((p) => ({ ...p, [note.id]: data.content }));
      } else if (action === "quiz") {
        setQuizzes((p) => ({ ...p, [note.id]: data.content }));
      } else if (action === "flashcards") {
        setCards((p) => ({ ...p, [note.id]: data.content }));
      }
    } catch (e) {
      alert("AI error: " + e.message);
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
        const cardArray = cards[n.id] ? tryParseFlashcards(cards[n.id]) : null;

        return (
          <div key={n.id} style={{ background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "1rem" }}>
            {/* header */}
            <div style={{ display: "flex", justifyContent: "space-between", gap: ".75rem" }}>
              <div>
                <strong style={{ fontSize: "1.05rem" }}>{n.title || "Untitled"}</strong>{" "}
                <span style={{ color: "#64748b", fontSize: ".85rem" }}>{new Date(n.date).toLocaleString()}</span>
                {n.subject && (
                  <span style={{ marginLeft: ".5rem", fontSize: ".75rem", background: "#eef2ff", color: "#3730a3", padding: ".15rem .5rem", borderRadius: "999px" }}>
                    {n.subject}
                  </span>
                )}
              </div>

              <div style={{ display: "flex", gap: ".4rem", alignItems: "center", flexWrap: "wrap" }}>
                <button onClick={() => callAI("summarize", n)} disabled={isLoading} style={btnBlue}>🧠 Summarize</button>
                <button onClick={() => callAI("quiz", n)} disabled={isLoading} style={btnGreen}>❓ Quiz</button>
                <button onClick={() => callAI("flashcards", n)} disabled={isLoading} style={btnPurple}>🎴 Flashcards</button>
                {onEdit && <button onClick={() => onEdit(n.id)} style={btnAmber}>✏️ Edit</button>}
                {onDelete && <button onClick={() => onDelete(n.id)} style={btnRed}>🗑️ Delete</button>}
                {isLoading && <span style={{ display: "inline-flex", gap: ".4rem", alignItems: "center", color: "#6b7280" }}><Spinner /> <span>AI working…</span></span>}
              </div>
            </div>

            <div style={{ marginTop: ".5rem", whiteSpace: "pre-wrap" }}>{n.content}</div>

            {summaryBullets?.length > 0 && (
              <div style={boxLight}>
                <strong>AI Summary</strong>
                <ul style={{ marginTop: ".4rem", paddingLeft: "1.1rem" }}>
                  {summaryBullets.map((b, i) => <li key={i}>{b}</li>)}
                </ul>
              </div>
            )}

            {quizArray?.length > 0 && (
              <div style={boxGreen}>
                <strong>Quiz</strong>
                <ol style={{ marginTop: ".4rem", paddingLeft: "1.1rem" }}>
                  {quizArray.map((qa, i) => (
                    <li key={i} style={{ marginBottom: ".35rem" }}>
                      {qa.q}
                      {qa.a ? <div style={{ color: "#065f46", marginTop: ".15rem" }}>→ {qa.a}</div> : null}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {cardArray?.length > 0 && <Flashcards cards={cardArray} />}
          </div>
        );
      })}
    </div>
  );
}

const btnBase = { padding: ".4rem .8rem", borderRadius: "8px", background: "transparent", cursor: "pointer" };
const btnBlue  = { ...btnBase, border: "1px solid #2563eb", color: "#2563eb" };
const btnGreen = { ...btnBase, border: "1px solid #16a34a", color: "#16a34a" };
const btnPurple= { ...btnBase, border: "1px solid #a855f7", color: "#7e22ce" };
const btnAmber = { ...btnBase, border: "1px solid #f59e0b", color: "#b45309" };
const btnRed   = { ...btnBase, border: "1px solid #ef4444", color: "#ef4444" };

const boxLight = { marginTop: ".75rem", padding: ".75rem", background: "#fff", border: "1px dashed #cbd5e1", borderRadius: "10px" };
const boxGreen = { marginTop: ".75rem", padding: ".75rem", background: "#ffffff", border: "1px dashed #a7f3d0", borderRadius: "10px" };
