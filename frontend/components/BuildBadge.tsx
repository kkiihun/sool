"use client";

import { useEffect, useState } from "react";

type BuildInfo = { branch: string; sha: string };

export default function BuildBadge() {
  const [info, setInfo] = useState<BuildInfo>({
    branch: "loading...",
    sha: "loading...",
  });

  useEffect(() => {
    fetch("/api/build", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setInfo({ branch: d.branch ?? "unknown-branch", sha: d.sha ?? "unknown-sha" }))
      .catch(() => setInfo({ branch: "unknown-branch", sha: "unknown-sha" }));
  }, []);

  return (
    <div style={{ position: "fixed", left: 12, bottom: 12, zIndex: 9999 }}>
      <div style={{ background: "#0b1220", color: "#fff", padding: "8px 10px", borderRadius: 10, fontSize: 12 }}>
        <div>{info.branch}</div>
        <div>{info.sha}</div>
      </div>
    </div>
  );
}
