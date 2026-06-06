import React from "react";
import { createRoot } from "react-dom/client";
import Form from "./components/form";

const App = () => {
  return (
    <>
      <Form />
    </>
  );
};

const root = createRoot(document.getElementById("root")!);

root.render(<App />);
