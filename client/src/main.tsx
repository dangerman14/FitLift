import { createRoot } from "react-dom/client";
import MinimalApp from "./minimal-app";
import "./index.css";

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(<MinimalApp />);
}
