"use client";

import type { ResponseStatus } from "@/hooks/useTaskDispatch";

interface ResponseCardProps {
  userName: string;
  content: string;
  status: ResponseStatus;
  error?: string;
}

const STATUS_STYLES: Record<ResponseStatus, { borderColor: string; label: string }> = {
  pending: { borderColor: "var(--text-muted)", label: "waiting..." },
  streaming: { borderColor: "var(--accent)", label: "" },
  done: { borderColor: "var(--success)", label: "" },
  error: { borderColor: "var(--error)", label: "" },
};

export function ResponseCard({
  userName,
  content,
  status,
  error,
}: ResponseCardProps) {
  const style = STATUS_STYLES[status];
  const initials = userName.charAt(0).toUpperCase();

  return (
    <div
      className="animate-fade-in"
      style={{
        backgroundColor: "var(--bg-surface)",
        border: "1px solid var(--border)",
        borderLeft: `3px solid ${style.borderColor}`,
        borderRadius: "var(--radius-sm)",
        padding: "12px 16px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: content || error ? 10 : 0,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: "var(--radius-full)",
            backgroundColor: "var(--accent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11,
            fontWeight: 600,
            color: "#fff",
            flexShrink: 0,
          }}
        >
          {initials}
        </div>
        <span
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: "var(--text-primary)",
          }}
        >
          {userName}
        </span>

        {status === "pending" && (
          <span
            style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: "auto" }}
          >
            {style.label}
          </span>
        )}

        {status === "streaming" && (
          <div
            style={{
              display: "flex",
              gap: 3,
              marginLeft: "auto",
              alignItems: "center",
            }}
          >
            <div className="loading-dot" />
            <div className="loading-dot" />
            <div className="loading-dot" />
          </div>
        )}

        {status === "done" && (
          <span
            style={{
              fontSize: 11,
              color: "var(--success)",
              marginLeft: "auto",
              fontWeight: 500,
            }}
          >
            complete
          </span>
        )}

        {status === "error" && (
          <span
            style={{
              fontSize: 11,
              color: "var(--error)",
              marginLeft: "auto",
              fontWeight: 500,
            }}
          >
            failed
          </span>
        )}
      </div>

      {status === "error" && error && (
        <p
          style={{
            fontSize: 12,
            color: "var(--error)",
            lineHeight: 1.5,
            padding: "8px 0 0 38px",
          }}
        >
          {error}
        </p>
      )}

      {content && (
        <div
          style={{
            fontSize: 13,
            color: "var(--text-secondary)",
            lineHeight: 1.6,
            padding: "0 0 0 38px",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {content}
        </div>
      )}
    </div>
  );
}
