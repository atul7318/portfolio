"use client";

import { useEffect, useState } from "react";

export default function Preloader() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setHidden(true), 2200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`preloader-screen ${hidden ? "hidden" : ""}`}>
      <div className="loader-text">AKT</div>
      <div style={{
        fontFamily: "var(--font-mono), 'Space Mono', monospace",
        fontSize: "0.65rem",
        letterSpacing: "0.35em",
        color: "rgba(240,240,240,0.3)",
        textTransform: "uppercase" as const,
        marginTop: "0.8rem",
      }}>Initialising systems…</div>
      <div className="loader-bar">
        <div className="loader-progress" />
      </div>
    </div>
  );
}
