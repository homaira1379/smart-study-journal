// src/App.jsx
import { useEffect, useMemo, useState } from "react";
import { loadNotes, saveNotes } from "./lib/storage";
import NoteForm from "./components/NoteForm";
import NoteList from "./components/NoteList";

export default function App() {
  // Notes
  const [notes, setNotes] = useState(loadNotes());

  // Form fields (for adding)
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");

  // UI filters
  const [query, setQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");

  // Busy state for AI
  const [busy, setBusy] = useState(false);

  // Persist
  useEffect(() => saveNotes(notes), [notes]);

  // Unique subjects
  const subjects = useMemo(
    () => Array.from(new Set(notes.map((n) => n.subject).filter(Boolean))).sort(),
    [notes]
  );

  // Add
  function addNote() {
    if (!content.trim() && !title.trim()) {
      alert("Please add a title or some content.");
      return;
    }
    const newNote = {
      id: Date.now(),
      title: title.trim() || `Note ${notes.length + 1}`,
      subject: subject.trim(),
      content,
      date: new Date().toISOString(),
      summary: "",
      quiz: [],
    };
    setNotes([newNote, ...notes]);
    setTitle("");
    setSubject("");
    setContent("");
  }

  // Edit (simple prompts for now)
  function editNote(id) {
    const n = notes.find((x) => x.id === id);
    if (!n) return;
    const newTitle = prompt("Edit title:", n.title) ?? n.title;
    const newSubject = prompt("Edit subject:", n.subject || "") ?? n.subject;
    const newContent = prompt("Edit content:", n.content) ?? n.content;
    updateNote(id, { title: newTitle, subject: newSubject, content: newContent });
  }

  // Update helper
  function updateNote(id, patch) {
    setNotes((old) =>
      old.map((n) => (n.id === id ? { ...n, ...patch, date: new Date().toISOString() } : n))
    );
  }

  // Delete
  function deleteNote(id) {
    if (confirm("Delete this note?")) setNotes((old) => old.filter((n) => n.id !== id));
  }

  // Delete all
  function deleteAll() {
    if (confirm("Delete ALL notes?")) setNotes([]);
  }

  // AI actions
  async function runAI(action, noteId) {
    const note = notes.find((n) => n.id === noteId);
    if (!note) return;

    try {
      setBusy(true);
      const r = await fetch("/api/openai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, text: note.content }),
      });
      const { content, error } = await r.json();
      if (error) throw new Error(error);

      if (action === "quiz") {
        let quiz;
        try {
          quiz = JSON.parse(content);
        } catch {
          // fallback: make questions from lines
          quiz = content
            .split("\n")
            .filter(Boolean)
            .slice(0, 3)
            .map((line) => ({ q: line.replace(/^\d+\.?\s*/, ""), a: "" }));
        }
        updateNote(noteId, { quiz });
      } else {
        // summarize or explain -> store in summary
        const cleaned = content.replace(/^\s*-\s*/gm, "").trim();
        updateNote(noteId, { summary: cleaned });
      }
    } catch (e) {
      alert("AI error: " + e.message);
    } finally {
      setBusy(false);
    }
  }

  // Filter + search
  const filteredNotes = useMemo(() => {
    const q = query.trim().toLowerCase();
    return notes.filter((n) => {
      const matchSubject = !subjectFilter || n.subject === subjectFilter;
      const matchQuery =
        !q ||
        n.title?.toLowerCase().includes(q) ||
        n.subject?.toLowerCase().includes(q) ||
        n.content?.toLowerCase().includes(q);
      return matchSubject && matchQuery;
    });
  }, [notes, query, subjectFilter]);

  return (
    <div
      style={{
        padding: "1.5rem",
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        maxWidth: "900px",
        margin: "0 auto",
      }}
    >
      {/* Header */}
      <header style={{ display: "flex", alignItems: "center", gap: ".6rem", marginBottom: "1rem" }}>
        <span style={{ fontSize: "2rem" }}>🧠</span>
        <h1 style={{ fontSize: "2rem", margin: 0 }}>Smart Study Journal</h1>
      </header>

      {/* Add form */}
      <NoteForm
        title={title}
        subject={subject}
        content={content}
        setTitle={setTitle}
        setSubject={setSubject}
        setContent={setContent}
        addNote={addNote}
      />

      {/* Toolbar */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 220px auto auto",
          gap: ".5rem",
          alignItems: "center",
          marginBottom: "0.75rem",
        }}
      >
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title, subject, or content…"
          style={{ width: "100%", padding: ".55rem .7rem", borderRadius: "8px", border: "1px solid #d1d5db" }}
        />

        <select
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
          style={{ width: "100%", padding: ".55rem .7rem", borderRadius: "8px", border: "1px solid #d1d5db", background: "#fff" }}
        >
          <option value="">All subjects</option>
          {subjects.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <div style={{ fontSize: ".95rem", color: "#6b7280" }}>
          {filteredNotes.length} note{filteredNotes.length === 1 ? "" : "s"} {busy ? " · ⚙️ AI…" : ""}
        </div>

        {notes.length > 0 && (
          <button
            onClick={deleteAll}
            style={{
              justifySelf: "end",
              padding: ".5rem .8rem",
              borderRadius: "8px",
              border: "1px solid #ef4444",
              color: "#ef4444",
              background: "transparent",
              cursor: "pointer",
            }}
          >
            🗑️ Delete All
          </button>
        )}
      </section>

      {/* Notes */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "1rem" }}>
        <NoteList
          notes={filteredNotes}
          onEdit={editNote}
          onDelete={deleteNote}
          onAI={runAI} // runAI('summarize'|'quiz', id)
        />
      </div>
    </div>
  );
}
