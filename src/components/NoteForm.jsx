import React, { useState } from "react";

export default function NoteForm({ onAdd }) {
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");

  function reset() {
    setTitle(""); setSubject(""); setContent("");
  }

  function handleSubmit(e) {
    e.preventDefault();
    const t = title.trim();
    const s = subject.trim();
    const c = content.trim();
    if (!c) {
      alert("Please write your note content.");
      return;
    }
    console.log("[NoteForm] submit", { t, s, c });
    try {
      onAdd?.({ title: t, subject: s, content: c });
      reset();
    } catch (err) {
      console.error("[NoteForm] onAdd error", err);
      alert("Could not add note. Check console for details.");
    }
  }

  return (
    <form onSubmit={handleSubmit}
      style={{ display:"grid", gap:".6rem", background:"#fff", border:"1px solid #e2e8f0", borderRadius:"12px", padding:"1rem", marginBottom:"1rem" }}>
      <input
        value={title}
        onChange={(e)=>setTitle(e.target.value)}
        placeholder="Title"
        style={{ padding:".65rem .75rem", border:"1px solid #e2e8f0", borderRadius:"10px" }}
      />
      <input
        value={subject}
        onChange={(e)=>setSubject(e.target.value)}
        placeholder="Subject (optional)"
        style={{ padding:".65rem .75rem", border:"1px solid #e2e8f0", borderRadius:"10px" }}
      />
      <textarea
        value={content}
        onChange={(e)=>setContent(e.target.value)}
        placeholder="Write your note..."
        rows={6}
        style={{ padding:".75rem .85rem", border:"1px solid #e2e8f0", borderRadius:"10px", resize:"vertical", whiteSpace:"pre-wrap" }}
      />
      <div>
        <button type="submit"
          disabled={!content.trim()}
          style={{ padding:".6rem .9rem", borderRadius:"10px", border:"1px solid #2563eb", color:"#2563eb", background:"transparent", cursor:"pointer" }}>
          ➕ Add Note
        </button>
      </div>
    </form>
  );
}
