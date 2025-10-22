// src/components/BackupBar.jsx
import { nanoid } from "nanoid";

export default function BackupBar({ notes = [], onImport }) {
  function exportJSON() {
    const data = JSON.stringify(notes, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const ts = new Date().toISOString().split("T")[0];
    a.download = `smart-study-notes-${ts}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importJSON() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const parsed = JSON.parse(text);
        if (!Array.isArray(parsed)) throw new Error("File must contain a JSON array.");

        // normalize + validate
        const cleaned = parsed.map((n) => normalizeNote(n)).filter(Boolean);

        if (cleaned.length === 0) {
          alert("No valid notes found in file.");
          return;
        }

        // merge by id (imported overwrites existing with same id)
        const map = new Map();
        // start with current
        for (const n of notes) map.set(n.id, n);
        // overwrite/insert imported
        for (const n of cleaned) map.set(n.id, n);

        const merged = Array.from(map.values()).sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        );

        onImport?.(merged);
        alert(`Imported ${cleaned.length} note(s).`);
      } catch (err) {
        alert("Import failed: " + err.message);
      }
    };
    input.click();
  }

  return (
    <div style={bar}>
      <div style={{ fontWeight: 600 }}>Backup</div>
      <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
        <button onClick={exportJSON} style={btnBlue} title="Download all notes as JSON">
          ⬇️ Export JSON
        </button>
        <button onClick={importJSON} style={btnGreen} title="Load notes from a JSON file">
          ⬆️ Import JSON
        </button>
      </div>
    </div>
  );
}

function normalizeNote(n) {
  try {
    const id = (typeof n.id === "string" && n.id) || nanoid();
    const title = String(n.title ?? "").trim();
    const subject = String(n.subject ?? "").trim();
    const content = String(n.content ?? "").trim();
    const dateRaw = n.date ?? Date.now();
    const date = isNaN(new Date(dateRaw)) ? new Date().toISOString() : new Date(dateRaw).toISOString();

    const note = { id, title, subject, content, date };

    // optional fields
    if (typeof n.summary === "string") note.summary = n.summary;
    if (Array.isArray(n.quiz)) note.quiz = n.quiz;
    return note;
  } catch {
    return null;
  }
}

/* styles */
const bar = {
  margin: "0.75rem 0 1rem",
  padding: ".6rem .8rem",
  border: "1px solid #e5e7eb",
  borderRadius: "10px",
  background: "#f8fafc",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};
const btnBase = {
  padding: ".45rem .8rem",
  borderRadius: "8px",
  background: "transparent",
  cursor: "pointer",
};
const btnBlue = { ...btnBase, border: "1px solid #2563eb", color: "#2563eb" };
const btnGreen = { ...btnBase, border: "1px solid #16a34a", color: "#16a34a" };
