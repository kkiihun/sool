"use client";

import { useEffect, useState } from "react";

type BuildInfo = { branch: string; sha: string };

export default function BuildBadge() {
  const [info, setInfo] = useState<BuildInfo | null>(null);

  useEffect(() => {
    fetch("/api/build", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setInfo({ branch: d.branch ?? "unknown", sha: d.sha ?? "unknown" }))
      .catch(() => setInfo({ branch: "unknown", sha: "unknown" }));
  }, []);

  return (
    <div style={{ position: "fixed", left: 12, bottom: 12, zIndex: 9999, pointerEvents: "none" }}>
      <div style={{ 
        background: "rgba(11, 18, 32, 0.9)", 
        backdropFilter: "blur(8px)",
        color: "#fff", 
        padding: "8px 12px", 
        borderRadius: 12, 
        fontSize: 10,
        border: "1px solid rgba(212, 175, 55, 0.4)",
        boxShadow: "0 4px 15px rgba(0,0,0,0.5)",
        display: "flex",
        flexDirection: "column",
        gap: 1
      }}>
        <div style={{ color: "#d4af37", fontWeight: 800, fontSize: 12 }}>v0.1.0-alpha</div>
        <div style={{ opacity: 0.5, fontSize: 9 }}>
          {info ? `${info.branch} • ${info.sha.slice(0, 7)}` : "initializing..."}
        </div>
      </div>
    </div>
  );
}
