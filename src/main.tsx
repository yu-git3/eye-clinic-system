import React from "react";
import ReactDOM from "react-dom/client";
import { OphthalmologyPrototype } from "../app/OphthalmologyPrototype";

import "../app/globals.css";
import "../app/baseline-print.css";
import "../app/baseline-composite.css";
import "../app/baseline-ordered.css";
import "../app/print-override.css";
import "../app/archive-lifecycle.css";
import "../app/specialty-record.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <OphthalmologyPrototype />
  </React.StrictMode>,
);
