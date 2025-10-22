// src/components/NoteList.jsx
import { useState } from "react";

// Tiny inline spinner (no CSS file needed)
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
      <path
        fill="currentColor"
        d="M25 5 a20 20 0 0 1 20 20"
      >
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
      alert("AI request failed. Check your OPENAI_API_KEY in Vercel settings.");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div>
      {notes.map((note) => {
        const isLoading = loadingId === note.id;
        return (
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

            <div style={{ display: "flex", gap: ".5rem", alignItems: "center", marginTop: ".5rem" }}>
              <button
                onClick={() => callAI("summarize", note)}
                disabled={isLoading}
                style={{
                  padding: ".4rem .8rem",
                  borderRadius: "6px",
                  border: "1px solid #2563eb",
                  background: "transparent",
                  color: "#2563eb",
                  cursor: isLoading ? "not-allowed" : "pointer",
                }}
                title="Generate a short summary"
              >
                🧠 Summarize
              </button>

              <button
                onClick={() => callAI("quiz", note)}
                disabled={isLoading}
                style={{
                  padding: ".4rem .8rem",
                  borderRadius: "6px",
                  border: "1px solid #16a34a",
                  background: "transparent",
                  color: "#16a34a",
                  cursor: isLoading ? "not-allowed" : "pointer",
                }}
                title="Create 3 quiz questions"
              >
                ❓ Quiz
              </button>

              {isLoading && (
                <span style={{ display: "inline-flex", gap: ".4rem", alignItems: "center", color: "#6b7280" }}>
                  <Spinner /> <span>AI working…</span>
                </span>
              )}
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
                <strong>AI Summary</strong>
                <p style={{ marginTop: ".3rem", whiteSpace: "pre-line" }}>
                  {summaries[note.id]}
                </p>
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
                <strong>AI Quiz</strong>
                <p style={{ marginTop: ".3rem", whiteSpace: "pre-line" }}>
                  {quizzes[note.id]}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
