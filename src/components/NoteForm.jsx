// src/components/NoteForm.jsx
export default function NoteForm({ title, subject, content, setTitle, setSubject, setContent, addNote }) {
  return (
    <div
      style={{
        background: "#f9fafb",
        padding: "1rem",
        borderRadius: "10px",
        marginBottom: "1.5rem",
        border: "1px solid #e5e7eb",
      }}
    >
      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={{
          width: "100%",
          padding: "0.5rem",
          marginBottom: "0.5rem",
          borderRadius: "6px",
          border: "1px solid #d1d5db",
        }}
      />

      <input
        type="text"
        placeholder="Subject (optional)"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        style={{
          width: "100%",
          padding: "0.5rem",
          marginBottom: "0.5rem",
          borderRadius: "6px",
          border: "1px solid #d1d5db",
        }}
      />

      <textarea
        rows="5"
        placeholder="Write your note..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        style={{
          width: "100%",
          padding: "0.6rem",
          borderRadius: "6px",
          border: "1px solid #d1d5db",
        }}
      ></textarea>

      <button
        onClick={addNote}
        style={{
          marginTop: "0.75rem",
          padding: "0.6rem 1rem",
          backgroundColor: "#2563eb",
          color: "#fff",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
        }}
      >
        ➕ Add Note
      </button>
    </div>
  );
}
