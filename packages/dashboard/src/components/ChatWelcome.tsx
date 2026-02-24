"use client";

import { Hexagon } from "lucide-react";

const CAPABILITIES = [
  "Bash",
  "Edit Files",
  "Web Search",
  "Memory",
  "Skills",
  "Browser",
  "Fetch URL",
  "Daily Notes",
];

interface ChatWelcomeProps {
  userName: string | undefined;
  onSuggestionClick: (text: string) => void;
}

export function ChatWelcome({ userName, onSuggestionClick }: ChatWelcomeProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        gap: 20,
        padding: 24,
      }}
    >
      {/* Agent avatar */}
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: "var(--radius-full)",
          background: "linear-gradient(135deg, #6366f1, #818cf8)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Hexagon size={26} color="#fff" />
      </div>

      {/* Title */}
      <div style={{ textAlign: "center" }}>
        <p
          style={{
            fontSize: 18,
            fontWeight: 500,
            color: "var(--text-primary)",
            marginBottom: 6,
          }}
        >
          Your Agent is Ready
        </p>
        <p
          style={{
            fontSize: 14,
            color: "var(--text-secondary)",
          }}
        >
          Connected to OpenClaw Gateway
        </p>
      </div>

      {/* Capability chips */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          justifyContent: "center",
          maxWidth: 420,
        }}
      >
        {CAPABILITIES.map((cap) => (
          <span
            key={cap}
            style={{
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-full)",
              padding: "5px 12px",
              fontSize: 12,
              color: "var(--text-muted)",
            }}
          >
            {cap}
          </span>
        ))}
      </div>

      {/* Prompt */}
      <p
        style={{
          fontSize: 13,
          color: "var(--text-muted)",
          marginTop: 8,
        }}
      >
        Type a message to start a conversation
      </p>
    </div>
  );
}
