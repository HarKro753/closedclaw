"use client";

import { useEffect, useState } from "react";
import { Eye, Send, UserX } from "lucide-react";
import { AgentDetailPanel } from "./AgentDetailPanel";
import type { AdminUser, Skill } from "@/hooks/useAdmin";

interface AgentsTabProps {
  users: AdminUser[];
  loading: boolean;
  onLoadUsers: () => Promise<void>;
  onDeactivate: (userId: string) => Promise<boolean>;
  onLoadMemory: (userId: string) => Promise<string>;
  onLoadSkills: (userId: string) => Promise<Skill[]>;
  onSendTask: (userId: string) => void;
}

export function AgentsTab({
  users,
  loading,
  onLoadUsers,
  onDeactivate,
  onLoadMemory,
  onLoadSkills,
  onSendTask,
}: AgentsTabProps) {
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    onLoadUsers();
  }, [onLoadUsers]);

  if (loading && users.length === 0) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 60,
          gap: 4,
        }}
      >
        <div className="loading-dot" />
        <div className="loading-dot" />
        <div className="loading-dot" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div
        style={{
          overflow: "hidden",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--border)",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "var(--bg-surface)" }}>
              {["User", "Status", "Messages", "Last Active", "Actions"].map(
                (header) => (
                  <th
                    key={header}
                    style={{
                      padding: "12px 16px",
                      textAlign: "left",
                      fontSize: 11,
                      fontWeight: 500,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      color: "var(--text-muted)",
                    }}
                  >
                    {header}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr
                key={u.id}
                style={{ borderTop: "1px solid var(--border)" }}
              >
                <td style={{ padding: "12px 16px" }}>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "var(--radius-full)",
                        backgroundColor: "var(--accent)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#fff",
                        flexShrink: 0,
                      }}
                    >
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p
                        style={{
                          fontSize: 13,
                          fontWeight: 500,
                          color: "var(--text-primary)",
                        }}
                      >
                        {u.name}
                        {u.isAdmin && (
                          <span
                            style={{
                              marginLeft: 8,
                              backgroundColor: "rgba(99,102,241,0.15)",
                              color: "var(--accent)",
                              borderRadius: "var(--radius-full)",
                              padding: "2px 8px",
                              fontSize: 11,
                            }}
                          >
                            Admin
                          </span>
                        )}
                      </p>
                      <p
                        style={{
                          fontSize: 12,
                          color: "var(--text-muted)",
                          marginTop: 2,
                        }}
                      >
                        {u.email}
                      </p>
                    </div>
                  </div>
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <span
                    style={{
                      display: "inline-block",
                      borderRadius: "var(--radius-full)",
                      padding: "2px 8px",
                      fontSize: 12,
                      fontWeight: 500,
                      backgroundColor:
                        u.agentStatus === "active"
                          ? "rgba(34,197,94,0.15)"
                          : "rgba(239,68,68,0.15)",
                      color:
                        u.agentStatus === "active"
                          ? "var(--success)"
                          : "var(--error)",
                    }}
                  >
                    {u.agentStatus}
                  </span>
                </td>
                <td
                  style={{
                    padding: "12px 16px",
                    fontSize: 13,
                    color: "var(--text-secondary)",
                  }}
                >
                  {u.messageCount}
                  <span
                    style={{
                      fontSize: 11,
                      color: "var(--text-muted)",
                      marginLeft: 4,
                    }}
                  >
                    {u.messageCount === 1 ? "msg" : "msgs"}
                  </span>
                </td>
                <td
                  style={{
                    padding: "12px 16px",
                    fontSize: 13,
                    color: "var(--text-secondary)",
                  }}
                >
                  {new Date(u.createdAt).toLocaleDateString()}
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <ActionButton
                      onClick={() => setSelectedUser(u)}
                      title="View Memory"
                    >
                      <Eye size={13} />
                      <span>Memory</span>
                    </ActionButton>
                    <ActionButton
                      onClick={() => onSendTask(u.id)}
                      title="Send Task"
                    >
                      <Send size={13} />
                      <span>Task</span>
                    </ActionButton>
                    {u.active && !u.isAdmin && (
                      <ActionButton
                        onClick={() => onDeactivate(u.id)}
                        title="Deactivate"
                        variant="danger"
                      >
                        <UserX size={13} />
                      </ActionButton>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedUser && (
        <AgentDetailPanel
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onLoadMemory={onLoadMemory}
          onLoadSkills={onLoadSkills}
        />
      )}
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  title,
  variant = "default",
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  variant?: "default" | "danger";
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="hover-transition"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        padding: "4px 8px",
        backgroundColor: "var(--bg-surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-sm)",
        fontSize: 11,
        color: variant === "danger" ? "var(--error)" : "var(--text-secondary)",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "var(--bg-hover)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "var(--bg-surface)";
      }}
    >
      {children}
    </button>
  );
}
