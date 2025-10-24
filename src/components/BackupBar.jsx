import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";

const uid =
  (typeof crypto !== "undefined" && crypto.randomUUID)
    ? () => crypto.randomUUID()
    : () => String(Date.now()) + Math.random().toString(36).slice(2);

// Convert Excel serial (e.g. 45257) to ISO string; otherwise try Date(...)
function excelDateToISO(v) {
  if (v == null || v === "") return new Date().toISOString();
  // If it’s already a valid date string
  const asDate = new Date(v);
  if (!Number.isNaN(asDate.getTime())) return asDate.toISOString();

  // Try Excel serial: days since 1899-12-30
  const serial = Number(v);
  if (!Number.isNaN(serial)) {
    const epoch = new Date(Date.UTC(1899, 11, 30));
    const ms = serial * 24 * 60 * 60 * 1000;
    return new Date(epoch.getTime() + ms).toISOString();
  }

  // Fallback: now
  return new Date().toISOString();
}

export default function BackupBar({ notes = [], onImport }) {
  // ---------- EXPORT: PDF ----------
  function exportPDF() {
    const doc = new jsPDF();
    doc.setFontSize(12);
    doc.text("Smart Study Journal - Notes", 10, 10);

    let y = 20;
    notes.forEach((n, i) => {
      const block = [
        `#${i + 1}  ${n.title || "Untitled"}`,
        `Subject: ${n.subject || "—"}`,
        `Date: ${new Date(n.date).toLocaleString()}`,
        "",
        (n.content || "").trim(),
        "",
        "———————————————",
      ].join("\n");

      const lines = doc.splitTextToSize(block, 180);
      if (y + lines.length * 6 > 280) {
        doc.addPage();
        y = 20;
      }
      doc.text(lines, 10, y);
      y += lines.length * 6;
    });

    doc.save("SmartStudyJournal_Notes.pdf");
  }

  // ---------- EXPORT: EXCEL ----------
  function exportExcel() {
    const rows = notes.map((n, i) => ({
      Index: i + 1,
      Title: n.title || "",
      Subject: n.subject || "",
      Date: new Date(n.date).toLocaleString(),
      Content: n.content || "",
      Summary: n.summary || "",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Notes");
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([wbout], { type: "application/octet-stream" }), "SmartStudyJournal_Notes.xlsx");
  }

  // ---------- IMPORT: JSON ----------
  function importJSON(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const imported = JSON.parse(String(evt.target?.result || "[]"));
        if (!Array.isArray(imported)) throw new Error("Not an array");
        const normalized = imported.map((n) => ({
          id: uid(),
          title: String(n?.title ?? "").trim(),
          subject: String(n?.subject ?? "").trim(),
          content: String(n?.content ?? "").trim(),
          summary: String(n?.summary ?? "").trim(),
          date: excelDateToISO(n?.date),
          quiz: Array.isArray(n?.quiz) ? n.quiz : undefined,
        }));
        onImport?.([...notes, ...normalized]);
        alert("Imported JSON successfully.");
      } catch (err) {
        alert("Import JSON failed: " + (err?.message || String(err)));
      }
    };
    reader.readAsText(file);
    // reset input so the same file can be chosen again
    e.target.value = "";
  }

  // ---------- IMPORT: EXCEL ----------
  function importExcel(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const wb = XLSX.read(data, { type: "array" });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

        // Normalize header names
        const normalized = rows.map((r) => {
          // Allow various casing/aliases
          const title   = r.Title ?? r.title ?? r.TITLE ?? "";
          const subject = r.Subject ?? r.subject ?? r.SUBJECT ?? "";
          const content = r.Content ?? r.content ?? r.CONTENT ?? "";
          const date    = r.Date ?? r.date ?? r.DATE ?? "";
          const summary = r.Summary ?? r.summary ?? r.SUMMARY ?? "";

          return {
            id: uid(),
            title: String(title).trim(),
            subject: String(subject).trim(),
            content: String(content).trim(),
            summary: String(summary).trim(),
            date: excelDateToISO(date),
            // quiz intentionally omitted on Excel import
          };
        });

        if (!normalized.length) {
          alert("No rows found. Make sure your sheet has headers: Title, Subject, Content, Date, Summary.");
          return;
        }

        onImport?.([...notes, ...normalized]);
        alert(`Imported ${normalized.length} row(s) from Excel.`);
      } catch (err) {
        alert("Import Excel failed: " + (err?.message || String(err)));
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  }

  return (
    <div
      style={{
        display: "flex",
        gap: ".75rem",
        alignItems: "center",
        marginBottom: "1rem",
        flexWrap: "wrap",
      }}
    >
      <button
        onClick={exportPDF}
        style={{
          padding: ".6rem .9rem",
          background: "#ef4444",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
        }}
      >
        📄 Export PDF
      </button>

      <button
        onClick={exportExcel}
        style={{
          padding: ".6rem .9rem",
          background: "#22c55e",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
        }}
      >
        📊 Export Excel
      </button>

      <label
        style={{
          padding: ".6rem .9rem",
          background: "#3b82f6",
          color: "white",
          borderRadius: "8px",
          cursor: "pointer",
        }}
      >
        ⬆ Import JSON
        <input type="file" accept=".json" onChange={importJSON} style={{ display: "none" }} />
      </label>

      <label
        style={{
          padding: ".6rem .9rem",
          background: "#0ea5e9",
          color: "white",
          borderRadius: "8px",
          cursor: "pointer",
        }}
      >
        ⬆ Import Excel
        <input type="file" accept=".xlsx,.xls" onChange={importExcel} style={{ display: "none" }} />
      </label>
    </div>
  );
}
