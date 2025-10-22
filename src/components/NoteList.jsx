// src/components/NoteList.jsx
import { useState } from "react";

export default function NoteList({ notes }) {
  const [loadingId, setLoadingId] = useState(null);
  const [summaries, setSummaries] = useState({});
  const [quizzes, setQuizzes] = useState({});

  if (notes.length === 0) {
    return <p>No notes yet. Create your first note above!</p>;
  }

  async function callAI(action, note) {
    setLoadingId(note.id);
    try {
      const res = await fetch("/api/openai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, text: note.content }),
      });
      const data = await res.json();

      if (action === "summarize") {
        setSummaries((prev) => ({ ...prev, [note.id]: data.content }));
      } else if (action === "quiz") {
        setQuizzes((prev) => ({ ...prev, [note.id]: data.content }));
      }
    } catch (err) {
      alert("AI request failed. Check your OpenAI key in Vercel settings.");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div>
      {notes.map((note) => (
        <div
          key={note.id}
          style={{
            borderBottom: "1px solid #e5e7eb",
            paddingBottom: "1rem",
            marginBottom: "1rem",
          }}
        >
          <h3 style={{ margin: 0 }}>
            {note.title || "Untitled"}{" "}
            <span style={{ color: "#6b7280", fontSize: "0.9rem" }}>
              ({new Date(note.date).toLocaleString()})
            </span>
          </h3>

          {note.subject && (
            <div style={{ color: "#2563eb", fontWeight: 500, marginBottom: ".25rem" }}>
              {note.subject}
            </div>
          )}

          <p style={{ whiteSpace: "pre-line" }}>{note.content}</p>

          <div style={{ display: "flex", gap: ".5rem", marginTop: ".5rem" }}>
            <button
              onClick={() => callAI("summarize", note)}
              disabled={loadingId === note.id}
              style={{
                padding: ".4rem .8rem",
                borderRadius: "6px",
                border: "1px solid #2563eb",
                background: "transparent",
                color: "#2563eb",
                cursor: "pointer",
              }}
            >
              🧠 Summarize
            </button>

            <button
              onClick={() => callAI("quiz", note)}
              disabled={loadingId === note.id}
              style={{
                padding: ".4rem .8rem",
                borderRadius: "6px",
                border: "1px solid #16a34a",
                background: "transparent",
                color: "#16a34a",
                cursor: "pointer",
              }}
            >
              ❓ Quiz
            </button>
          </div>

          {summaries[note.id] && (
            <div
              style={{
                background: "#f9fafb",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                marginTop: ".75rem",
                padding: ".75rem",
              }}
            >
              <strong>AI Summary:</strong>
              <p style={{ marginTop: ".3rem" }}>{summaries[note.id]}</p>
            </div>
          )}

          {quizzes[note.id] && (
            <div
              style={{
                background: "#ecfdf5",
                border: "1px solid #a7f3d0",
                borderRadius: "8px",
                marginTop: ".75rem",
                padding: ".75rem",
              }}
            >
              <strong>AI Quiz:</strong>
              <p style={{ marginTop: ".3rem" }}>{quizzes[note.id]}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
