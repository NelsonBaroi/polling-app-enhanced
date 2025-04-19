import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// Create root and render the App component inside StrictMode
const rootElement = document.getElementById("root");

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  console.error("❌ Root element not found. Ensure your index.html contains a div with id='root'.");
}
