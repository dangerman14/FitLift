import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

function App() {
  return React.createElement(
    "div",
    {
      style: {
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f5f5f5",
        fontFamily: "system-ui, sans-serif"
      }
    },
    React.createElement(
      "div",
      { style: { textAlign: "center" } },
      React.createElement("h1", { style: { fontSize: "2rem", marginBottom: "1rem" } }, "Fitness Tracker"),
      React.createElement("p", { style: { color: "#666", marginBottom: "1rem" } }, "Restoring application..."),
      React.createElement("div", { style: { fontSize: "0.875rem", color: "#999" } }, "Technical issues are being resolved")
    )
  );
}

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(React.createElement(App));
}
