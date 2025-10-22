// src/components/NoteList.jsx
export default function NoteList({ notes, onEdit, onDelete, onAI }) {
  if (!notes.length) return <p>No notes yet. Create your first note above!</p>;

  return (
    <ul style={{ display: "grid", gap: ".75rem", listStyle: "none", padding: 0, margin: 0 }}>
      {notes.map((n) => (
        <li
          key={n.id}
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: "10px",
            padding: ".75rem",
            background: "#fafafa",
          }}
        >
          <div style={{ display: "flex", gap: ".5rem", alignItems: "baseline", justifyContent: "space-between" }}>
            <div>
              <strong>{n.title || "Untitled"}</strong>{" "}
              <span style={{ fontSize: ".75rem", color: "#6b7280" }}>{new Date(n.date).toLocaleString()}</span>
              {n.subject && (
                <span
                  style={{
                    marginLeft: ".5rem",
                    fontSize: ".75rem",
                    background: "#eef2ff",
                    color: "#3730a3",
                    padding: ".1rem .45rem",
                    borderRadius: "999px",
                  }}
                >
                  {n.subject}
                </span>
              )}
            </div>

            <div style={{ display: "flex", gap: ".4rem" }}>
              <button onClick={() => onAI("summarize", n.id)} className="btn-ghost">📝 Summarize</button>
              <button onClick={() => onAI("quiz", n.id)} className="btn-ghost">❓ Quiz</button>
              <button onClick={() => onEdit(n.id)} className="btn-ghost">✏️ Edit</button>
              <button onClick={() => onDelete(n.id)} className="btn-danger">🗑️ Delete</button>
            </div>
          </div>

          <div style={{ marginTop: ".5rem", whiteSpace: "pre-wrap" }}>{n.content}</div>

          {n.summary && (
            <div style={{ marginTop: ".5rem", padding: ".5rem", background: "#ffffff", border: "1px dashed #d1d5db", borderRadius: "8px" }}>
              <strong>AI Summary</strong>
              <div style={{ marginTop: ".25rem", whiteSpace: "pre-wrap" }}>{n.summary}</div>
            </div>
          )}

          {Array.isArray(n.quiz) && n.quiz.length > 0 && (
            <div style={{ marginTop: ".5rem", padding: ".5rem", background: "#ffffff", border: "1px dashed #d1d5db", borderRadius: "8px" }}>
              <strong>Quiz</strong>
              <ol style={{ marginTop: ".25rem" }}>
                {n.quiz.map((q, i) => (
                  <li key={i} style={{ marginBottom: ".25rem" }}>
                    {q.q} {q.a ? <em>— Answer: {q.a}</em> : null}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
