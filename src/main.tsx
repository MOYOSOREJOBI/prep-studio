import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App";
import "./index.css";

function renderFatal(message: string) {
  const root = document.getElementById("root");
  if (!root) {
    return;
  }
  root.innerHTML = `
    <div style="height:100vh;display:flex;align-items:center;justify-content:center;background:#0b0d12;color:#f5f0e8;padding:24px;">
      <div style="width:min(900px,100%);border:1px solid rgba(255,255,255,0.12);padding:24px;border-radius:24px;background:rgba(15,18,24,0.9);font-family:'Avenir Next','Segoe UI',sans-serif;white-space:pre-wrap;line-height:1.7;">
Prep Studio error

${message}
      </div>
    </div>
  `;
}

window.addEventListener("error", (event) => {
  renderFatal(String(event.error?.stack ?? event.error?.message ?? event.message ?? "Unknown error"));
});

window.addEventListener("unhandledrejection", (event) => {
  const reason = event.reason;
  renderFatal(String(reason?.stack ?? reason?.message ?? reason ?? "Unhandled promise rejection"));
});

try {
  ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
      <HashRouter>
        <App />
      </HashRouter>
    </React.StrictMode>
  );
} catch (error) {
  renderFatal(String((error as Error)?.stack ?? (error as Error)?.message ?? error));
}
