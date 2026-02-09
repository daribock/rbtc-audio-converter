import React from "react";
import { createRoot } from "react-dom/client";

const App = () => {
  return <h2>Hello test React!</h2>;
};

const root = createRoot(document.getElementById("root")!);

root.render(<App />);
