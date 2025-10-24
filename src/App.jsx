import { useEffect, useMemo, useState } from "react";
import NoteForm from "./components/NoteForm";
import NoteList from "./components/NoteList";
import BackupBar from "./components/BackupBar";
import { loadNotes, saveNotes } from "./lib/storage";

// Safe unique ID generator
const uid =
  (typeof crypto !== "undefined" && crypto.randomUUID)
    ? () => crypto.randomUUID()
    : () => String(Date.now()) + Math.random().toString(36).slice(2);

export default function App() {
  // --- STATE ---
  const [notes, setNotes] = useState(() => {
    try {
      const n = loadNotes();
      return Array.isArray(n) ? n : [];
    } catch {
      return [];
    }
  });
  const [subjectFilter, setSubjectFilter] = useState("All subjects");
  const [query, setQuery] = useState("");

  // --- SAVE NOTES TO LOCALSTORAGE ---
  useEffect(() => {
    try {
      saveNotes(notes);
    } catch (err) {
      console.error("Failed to save notes:", err);
    }
  }, [notes]);

  // --- UNIQUE SUBJECTS LIST ---
  const subjects = useMemo(() => {
    const s = new Set();
    notes.forEach((n) => {
      const v = (n.subject || "").trim();
      if (v) s.add(v);
    });
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [notes]);

  // --- FILTERED NOTES ---
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return notes.filter((n) => {
      if (subjectFilter !== "All subjects" && (n.subject || "") !== subjectFilter)
        return false;
      if (!q) return true;
      const blob = `${n.title || ""}\n${n.subject || ""}\n${n.content || ""}`.toLowerCase();
      return blob.includes(q);
    });
  }, [notes, subjectFilter, query]);

  // --- HANDLERS ---
  function handleAdd(newNote) {
    const note = {
      id: newNote?.id || uid(),
      title: (newNote?.title || "").trim(),
      subject: (newNote?.subject || "").trim(),
      content: (newNote?.content || "").trim(),
      date: newNote?.date || new Date().toISOString(),
      summary: newNote?.summary,
      quiz: Array.isArray(newNote?.quiz) ? newNote.quiz : undefined,
    };
    setNotes((prev) => [note, ...prev]);
  }

  function handleDelete(id) {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }

  function handleDeleteAll() {
    if (notes.length && confirm("Delete ALL notes? This cannot be undone.")) {
      setNotes([]);
    }
  }

  function handleEdit(id) {
    const n = notes.find((x) => x.id === id);
    if (!n) return;
    const title = prompt("Edit title:", n.title ?? "");
    if (title === null) return;
    const subject = prompt("Edit subject (optional):", n.subject ?? "");
    if (subject === null) return;
    const content = prompt("Edit content:", n.content ?? "");
    if (content === null) return;

    setNotes((prev) =>
      prev.map((x) =>
        x.id === id
          ? {
              ...x,
              title: title.trim(),
              subject: subject.trim(),
              content: content.trim(),
              date: new Date().toISOString(),
            }
          : x
      )
    );
  }

  function handleImport(merged) {
    setNotes(merged);
  }

  // --- RENDER ---
  return (
    <div style={{ maxWidth: 920, margin: "0 auto", padding: "1.25rem" }}>
      <h1
        style={{
          display: "flex",
          alignItems: "center",
          gap: ".6rem",
          marginBottom: ".75rem",
        }}
      >
        <span style={{ fontSize: "1.9rem" }}>🧠</span>
        <span
          style={{
            fontSize: "2rem",
            lineHeight: 1.1,
            fontWeight: 800,
            color: "#0f172a",
          }}
        >
          Smart Study Journal
        </span>
      </h1>

      <NoteForm onAdd={handleAdd} />
      <BackupBar notes={notes} onImport={handleImport} />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto auto",
          gap: ".6rem",
          alignItems: "center",
          margin: "0.6rem 0 1rem",
        }}
      >
        <input
          type="text"
          placeholder="Search by title, subject, or content..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            width: "100%",
            padding: ".65rem .75rem",
            border: "1px solid #e2e8f0",
            borderRadius: "10px",
            outline: "none",
          }}
        />
        <select
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
          style={{
            padding: ".65rem .75rem",
            border: "1px solid #e2e8f0",
            borderRadius: "10px",
            background: "white",
            cursor: "pointer",
          }}
        >
          <option>All subjects</option>
          {subjects.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button
          onClick={handleDeleteAll}
          style={{
            padding: ".6rem .9rem",
            borderRadius: "10px",
            border: "1px solid #ef4444",
            color: "#ef4444",
            background: "transparent",
            cursor: "pointer",
          }}
        >
          🗑️ Delete All
        </button>
      </div>

      <NoteList notes={filtered} onEdit={handleEdit} onDelete={handleDelete} />
      <div style={{ color: "#64748b", fontSize: ".85rem", marginTop: "1rem" }}>
        Showing <strong>{filtered.length}</strong>{" "}
        {filtered.length === 1 ? "note" : "notes"} (total {notes.length})
      </div>
    </div>
  );
}
