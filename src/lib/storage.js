// src/lib/storage.js
const KEY = "ssj.notes.v1";

export function loadNotes() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || [];
  } catch {
    return [];
  }
}

export function saveNotes(notes) {
  localStorage.setItem(KEY, JSON.stringify(notes));
}
