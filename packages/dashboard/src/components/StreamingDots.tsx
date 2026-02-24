"use client";

import { Sparkles } from "lucide-react";

export function StreamingDots() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "flex-start",
        gap: 10,
        alignItems: "flex-start",
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: "var(--radius-full)",
          background: "linear-gradient(135deg, #6366f1, #818cf8)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          marginTop: 2,
        }}
      >
        <Sparkles size={13} color="#fff" />
      </div>
      <div style={{ display: "flex", gap: 4, paddingTop: 8 }}>
        <div className="loading-dot" />
        <div className="loading-dot" />
        <div className="loading-dot" />
      </div>
    </div>
  );
}
