import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const root = document.getElementById("root");
if (root) {
  try {
    createRoot(root).render(<App />);
  } catch (error) {
    console.error('App rendering failed:', error);
    // Fallback simple message
    root.innerHTML = '<div style="padding: 20px; font-family: Arial;"><h1>FitTracker</h1><p>Loading issue detected. Please refresh the page.</p></div>';
  }
}
