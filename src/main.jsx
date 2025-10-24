import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

console.log("[boot] main.jsx loaded");

const rootEl = document.getElementById("root");
if (!rootEl) {
  const p = document.createElement("pre");
  p.textContent = '❌ Missing <div id="root"> in index.html';
  document.body.appendChild(p);
} else {
  createRoot(rootEl).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

// hide "Loading…" once React runs
const loading = document.getElementById("loading");
if (loading) loading.remove();
