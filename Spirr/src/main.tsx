import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { setNow } from "./lib/clock";
import { loadBoxes } from "./lib/storage";
import { seedDemoData } from "./lib/seedDemoData";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import "./index.css";

const params = new URLSearchParams(window.location.search);

// Tier-2 simulation seam: replay a recorded scenario in the real UI at a fixed date.
// `?simNow=2026-03-15` (any Date-parsable value) freezes the clock; omit it for real time.
const simNow = params.get("simNow");
if (simNow) {
  setNow(simNow);
}

if (params.has("seed") && loadBoxes().length === 0) {
  seedDemoData();
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
