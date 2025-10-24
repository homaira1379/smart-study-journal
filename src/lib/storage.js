// /src/lib/storage.js
const KEY = "smart-study-notes";

export function loadNotes() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    // corrupted storage → reset
    localStorage.removeItem(KEY);
    return [];
  }
}

export function saveNotes(notes) {
  try {
    const safe = Array.isArray(notes) ? notes : [];
    localStorage.setItem(KEY, JSON.stringify(safe));
  } catch (e) {
    console.error("saveNotes failed:", e);
  }
}
