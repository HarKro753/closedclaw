"use client";

import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";

interface GatewayOfflineBannerProps {
  visible: boolean;
}

export function GatewayOfflineBanner({ visible }: GatewayOfflineBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (!visible || dismissed) return null;

  return (
    <div
      className="animate-fade-in"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: "10px 16px",
        backgroundColor: "rgba(245, 158, 11, 0.12)",
        borderBottom: "1px solid rgba(245, 158, 11, 0.2)",
        fontSize: 13,
        color: "#f59e0b",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <AlertTriangle size={14} />
        <span>
          OpenClaw Gateway is offline. Start it with{" "}
          <code
            style={{
              backgroundColor: "rgba(255,255,255,0.06)",
              padding: "2px 6px",
              borderRadius: 4,
              fontSize: 12,
            }}
          >
            openclaw gateway start
          </code>
        </span>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="hover-transition"
        style={{
          background: "none",
          border: "none",
          color: "#f59e0b",
          cursor: "pointer",
          padding: 4,
          borderRadius: "var(--radius-sm)",
          display: "flex",
          alignItems: "center",
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "rgba(245, 158, 11, 0.15)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "transparent";
        }}
      >
        <X size={14} />
      </button>
    </div>
  );
}
