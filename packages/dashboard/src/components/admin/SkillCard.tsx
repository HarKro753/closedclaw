"use client";

import { Pencil, Rocket } from "lucide-react";

interface SkillCardProps {
  name: string;
  content: string;
  onEdit: (name: string) => void;
  onDeployToAll: (name: string) => void;
}

export function SkillCard({
  name,
  content,
  onEdit,
  onDeployToAll,
}: SkillCardProps) {
  const lineCount = content.split("\n").filter((l) => l.trim().length > 0).length;

  return (
    <div
      style={{
        backgroundColor: "var(--bg-surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)",
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div>
        <p
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: "var(--text-primary)",
            marginBottom: 4,
          }}
        >
          {name}
        </p>
        <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
          {lineCount} {lineCount === 1 ? "rule" : "rules"}
        </p>
      </div>

      <p
        style={{
          fontSize: 12,
          color: "var(--text-secondary)",
          lineHeight: 1.5,
          overflow: "hidden",
          display: "-webkit-box",
          WebkitLineClamp: 3,
          WebkitBoxOrient: "vertical" as const,
        }}
      >
        {content.slice(0, 200)}
      </p>

      <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
        <button
          onClick={() => onEdit(name)}
          className="hover-transition"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: "6px 10px",
            backgroundColor: "var(--bg-input)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-sm)",
            fontSize: 12,
            color: "var(--text-secondary)",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--bg-hover)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "var(--bg-input)";
          }}
        >
          <Pencil size={12} />
          Edit
        </button>
        <button
          onClick={() => onDeployToAll(name)}
          className="hover-transition"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: "6px 10px",
            backgroundColor: "rgba(99,102,241,0.1)",
            border: "1px solid rgba(99,102,241,0.2)",
            borderRadius: "var(--radius-sm)",
            fontSize: 12,
            color: "var(--accent)",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(99,102,241,0.2)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(99,102,241,0.1)";
          }}
        >
          <Rocket size={12} />
          Deploy to all
        </button>
      </div>
    </div>
  );
}
