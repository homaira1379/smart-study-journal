// src/components/Flashcards.jsx
import { useMemo, useState } from "react";

export default function Flashcards({ cards = [] }) {
  const clean = useMemo(() => cards.filter(c => (c.front?.trim() || c.back?.trim())), [cards]);
  const [idx, setIdx] = useState(0);
  const [showBack, setShowBack] = useState(false);

  if (!clean.length) return null;
  const card = clean[idx] || { front: "", back: "" };

  function next()   { setIdx(i => (i + 1) % clean.length); setShowBack(false); }
  function prev()   { setIdx(i => (i - 1 + clean.length) % clean.length); setShowBack(false); }
  function flip()   { setShowBack(s => !s); }
  function shuffle(){ setIdx(Math.floor(Math.random() * clean.length)); setShowBack(false); }

  const btn = { padding: ".45rem .8rem", borderRadius: "8px", border:"1px solid #94a3b8", background:"transparent", color:"#334155", cursor:"pointer" };

  return (
    <div style={{ marginTop: ".75rem", padding: ".75rem", background: "#fff", border: "1px dashed #cbd5e1", borderRadius: "12px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: ".5rem" }}>
        <strong>Flashcards</strong>
        <span style={{ color: "#64748b" }}>{idx + 1} / {clean.length}</span>
      </div>

      <div
        onClick={flip}
        title="Click to flip"
        style={{
          cursor: "pointer",
          padding: "1rem",
          minHeight: "100px",
          borderRadius: "12px",
          border: "1px solid #e5e7eb",
          background: showBack ? "#ecfeff" : "#f8fafc",
          transition: "background .2s",
          whiteSpace: "pre-wrap",
          fontSize: "1.05rem",
        }}
      >
        {showBack ? card.back || "(no back)" : card.front || "(no front)"}
      </div>

      <div style={{ display: "flex", gap: ".5rem", marginTop: ".6rem" }}>
        <button onClick={prev} style={btn}>⟵ Prev</button>
        <button onClick={flip} style={btn}>🔁 Flip</button>
        <button onClick={next} style={btn}>Next ⟶</button>
        <button onClick={shuffle} style={{ ...btn, borderColor: "#a855f7", color: "#7e22ce" }}>🎲 Shuffle</button>
      </div>
    </div>
  );
}
