"use client";

export default function BuildBadge() {
  const branch = process.env.NEXT_PUBLIC_GIT_BRANCH ?? "unknown-branch";
  const sha = process.env.NEXT_PUBLIC_GIT_SHA ?? "unknown-sha";
  const time = process.env.NEXT_PUBLIC_BUILD_TIME ?? "";

  const show =
    process.env.NODE_ENV !== "production" ||
    process.env.NEXT_PUBLIC_SHOW_BUILD_BADGE === "1";

  if (!show) return null;

  return (
    <div
      style={{
        position: "fixed",
        left: 12,
        bottom: 12,
        zIndex: 9999,
        fontSize: 12,
        lineHeight: 1.2,
        padding: "6px 8px",
        borderRadius: 10,
        border: "1px solid rgba(255,255,255,0.18)",
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(6px)",
        color: "rgba(255,255,255,0.9)",
        fontFamily:
          "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
      }}
      title={time ? `build: ${time}` : undefined}
    >
      <div style={{ opacity: 0.9 }}>{branch}</div>
      <div style={{ opacity: 0.7 }}>{sha}</div>
    </div>
  );
}
