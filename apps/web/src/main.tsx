import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { applyTheme, getStoredTheme } from "./theme";
import "./styles.css";

// Applied before the first render, not inside a component effect, so a
// stored Dark or Feel Good choice is already on the root element by the
// time anything paints — otherwise the page would flash Light first.
applyTheme(getStoredTheme());

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Missing #root element");
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
