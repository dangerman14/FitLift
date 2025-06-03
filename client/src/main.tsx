import { createRoot } from "react-dom/client";
import "./index.css";

function SimpleTest() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Simple Test Working</h1>
        <p>Basic React is functioning correctly.</p>
      </div>
    </div>
  );
}

const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(<SimpleTest />);
}
