"use client";

import { Sparkles } from "lucide-react";

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  testId?: string;
}

export function MessageBubble({ role, content, testId }: MessageBubbleProps) {
  if (role === "user") {
    return (
      <div
        data-testid={testId}
        className="animate-message-in"
        style={{
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <div
          style={{
            backgroundColor: "var(--user-bubble)",
            color: "var(--user-bubble-text)",
            borderRadius: "var(--radius-lg) var(--radius-lg) 4px var(--radius-lg)",
            padding: "10px 14px",
            maxWidth: "70%",
            fontSize: 14,
            lineHeight: 1.7,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {content}
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid={testId}
      className="animate-message-in"
      style={{
        display: "flex",
        justifyContent: "flex-start",
        gap: 10,
        alignItems: "flex-start",
      }}
    >
      {/* Agent avatar */}
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

      {/* Message text — no bubble background */}
      <div
        style={{
          color: "var(--agent-bubble-text)",
          fontSize: 14,
          lineHeight: 1.7,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          maxWidth: "70%",
        }}
      >
        {content}
      </div>
    </div>
  );
}
