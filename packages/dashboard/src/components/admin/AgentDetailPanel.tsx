"use client";

import { useState, useEffect, useCallback } from "react";
import { X } from "lucide-react";
import type { AdminUser, Skill } from "@/hooks/useAdmin";

interface AgentDetailPanelProps {
  user: AdminUser;
  onClose: () => void;
  onLoadMemory: (userId: string) => Promise<string>;
  onLoadSkills: (userId: string) => Promise<Skill[]>;
}

export function AgentDetailPanel({
  user,
  onClose,
  onLoadMemory,
  onLoadSkills,
}: AgentDetailPanelProps) {
  const [memory, setMemory] = useState<string>("");
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [memoryResult, skillsResult] = await Promise.all([
      onLoadMemory(user.id),
      onLoadSkills(user.id),
    ]);
    setMemory(memoryResult);
    setSkills(skillsResult);
    setLoading(false);
  }, [user.id, onLoadMemory, onLoadSkills]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const initials = user.name.charAt(0).toUpperCase();

  return (
    <div
      className="animate-fade-in"
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        width: 400,
        height: "100vh",
        backgroundColor: "var(--bg-sidebar)",
        borderLeft: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        zIndex: 50,
        boxShadow: "-4px 0 24px rgba(0,0,0,0.4)",
      }}
    >
      <div
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "var(--radius-full)",
              backgroundColor: "var(--accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              fontWeight: 600,
              color: "#fff",
            }}
          >
            {initials}
          </div>
          <div>
            <p
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "var(--text-primary)",
              }}
            >
              {user.name}
            </p>
            <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
              {user.email}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="hover-transition"
          style={{
            background: "none",
            border: "none",
            color: "var(--text-muted)",
            cursor: "pointer",
            padding: 4,
            borderRadius: "var(--radius-sm)",
            display: "flex",
            alignItems: "center",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--text-primary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--text-muted)";
          }}
        >
          <X size={18} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
        {loading ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 40,
              gap: 4,
            }}
          >
            <div className="loading-dot" />
            <div className="loading-dot" />
            <div className="loading-dot" />
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 24 }}>
              <h4
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: "var(--text-muted)",
                  marginBottom: 8,
                }}
              >
                Agent Info
              </h4>
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <InfoBadge label="Messages" value={String(user.messageCount)} />
                <InfoBadge label="Status" value={user.agentStatus} />
                <InfoBadge label="Skills" value={String(skills.length)} />
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <h4
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: "var(--text-muted)",
                  marginBottom: 8,
                }}
              >
                Memory
              </h4>
              <div
                style={{
                  backgroundColor: "var(--bg-surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                  padding: 12,
                  fontSize: 12,
                  color: "var(--text-secondary)",
                  lineHeight: 1.6,
                  whiteSpace: "pre-wrap",
                  maxHeight: 300,
                  overflowY: "auto",
                }}
              >
                {memory || "No memory content"}
              </div>
            </div>

            <div>
              <h4
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: "var(--text-muted)",
                  marginBottom: 8,
                }}
              >
                Skills ({skills.length})
              </h4>
              {skills.length === 0 ? (
                <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  No skills deployed
                </p>
              ) : (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 6 }}
                >
                  {skills.map((skill) => (
                    <div
                      key={skill.name}
                      style={{
                        backgroundColor: "var(--bg-surface)",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius-sm)",
                        padding: "8px 12px",
                        fontSize: 12,
                        color: "var(--text-primary)",
                        fontWeight: 500,
                      }}
                    >
                      {skill.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function InfoBadge({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        backgroundColor: "var(--bg-surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-sm)",
        padding: "6px 10px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        minWidth: 70,
      }}
    >
      <span
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: "var(--text-primary)",
        }}
      >
        {value}
      </span>
      <span
        style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}
      >
        {label}
      </span>
    </div>
  );
}
