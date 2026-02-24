"use client";

import { Sparkles } from "lucide-react";

const SUGGESTIONS = [
  "Write code",
  "Research",
  "Brainstorm",
  "Summarize",
];

interface ChatWelcomeProps {
  userName: string | undefined;
  onSuggestionClick: (text: string) => void;
}

export function ChatWelcome({ userName, onSuggestionClick }: ChatWelcomeProps) {
  const displayName = userName ?? "there";

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
          width: 48,
          height: 48,
          borderRadius: "var(--radius-full)",
          background: "linear-gradient(135deg, #6366f1, #818cf8)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Sparkles size={22} color="#fff" />
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
          Your personal AI agent
        </p>
        <p
          style={{
            fontSize: 14,
            color: "var(--text-secondary)",
          }}
        >
          Hello, {displayName}. What can I help you with?
        </p>
      </div>

      {/* Suggestion chips */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          justifyContent: "center",
          maxWidth: 400,
        }}
      >
        {SUGGESTIONS.map((text) => (
          <button
            key={text}
            onClick={() => onSuggestionClick(text)}
            className="hover-transition"
            style={{
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-full)",
              padding: "6px 14px",
              fontSize: 13,
              color: "var(--text-secondary)",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--bg-hover)";
              e.currentTarget.style.color = "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "var(--bg-surface)";
              e.currentTarget.style.color = "var(--text-secondary)";
            }}
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}
