import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { loadBoxes } from "./lib/storage";
import { seedDemoData } from "./lib/seedDemoData";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import "./index.css";

if (new URLSearchParams(window.location.search).has("seed") && loadBoxes().length === 0) {
  seedDemoData();
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
