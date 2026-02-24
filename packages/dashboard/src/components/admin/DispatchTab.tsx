"use client";

import { useState, useEffect } from "react";
import { Send } from "lucide-react";
import { ResponseCard } from "./ResponseCard";
import { useTaskDispatch } from "@/hooks/useTaskDispatch";
import type { AdminUser } from "@/hooks/useAdmin";

interface DispatchTabProps {
  users: AdminUser[];
  token: string | null;
  preselectedUserId?: string | null;
  onLoadUsers: () => Promise<void>;
}

export function DispatchTab({
  users,
  token,
  preselectedUserId,
  onLoadUsers,
}: DispatchTabProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState("");
  const { responses, dispatching, dispatchTask, clearResponses } =
    useTaskDispatch(token);

  useEffect(() => {
    onLoadUsers();
  }, [onLoadUsers]);

  useEffect(() => {
    if (preselectedUserId) {
      setSelectedIds(new Set([preselectedUserId]));
    }
  }, [preselectedUserId]);

  const activeUsers = users.filter(
    (u) => u.active && u.agentStatus === "active"
  );

  function toggleUser(userId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  }

  function toggleAll() {
    if (selectedIds.size === activeUsers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(activeUsers.map((u) => u.id)));
    }
  }

  async function handleSend() {
    if (selectedIds.size === 0 || !message.trim()) return;

    const selectedAgents = activeUsers
      .filter((u) => selectedIds.has(u.id))
      .map((u) => ({ id: u.id, name: u.name }));

    clearResponses();
    await dispatchTask(selectedAgents, message.trim());
  }

  const allSelected = activeUsers.length > 0 && selectedIds.size === activeUsers.length;

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 16 }}>
        <h3
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--text-primary)",
            marginBottom: 4,
          }}
        >
          Task Dispatch
        </h3>
        <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
          Send a task or question to one or more agents below you
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "280px 1fr",
          gap: 16,
          marginBottom: 24,
        }}
      >
        {/* Agent selection */}
        <div
          style={{
            backgroundColor: "var(--bg-surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "10px 14px",
              borderBottom: "1px solid var(--border)",
              fontSize: 11,
              fontWeight: 500,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "var(--text-muted)",
            }}
          >
            Select Agents
          </div>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 14px",
              borderBottom: "1px solid var(--border)",
              cursor: "pointer",
              fontSize: 13,
              color: "var(--text-primary)",
              fontWeight: 500,
            }}
          >
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleAll}
              style={{ accentColor: "var(--accent)" }}
            />
            All agents
          </label>

          <div style={{ maxHeight: 300, overflowY: "auto" }}>
            {activeUsers.map((u) => (
              <label
                key={u.id}
                className="hover-transition"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 14px",
                  cursor: "pointer",
                  fontSize: 13,
                  color: "var(--text-secondary)",
                  backgroundColor: selectedIds.has(u.id)
                    ? "var(--bg-hover)"
                    : "transparent",
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedIds.has(u.id)}
                  onChange={() => toggleUser(u.id)}
                  style={{ accentColor: "var(--accent)" }}
                />
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: "var(--radius-full)",
                    backgroundColor: "var(--accent)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 10,
                    fontWeight: 600,
                    color: "#fff",
                    flexShrink: 0,
                  }}
                >
                  {u.name.charAt(0).toUpperCase()}
                </div>
                {u.name}
              </label>
            ))}
          </div>
        </div>

        {/* Task input */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div
            style={{
              padding: "10px 14px",
              fontSize: 11,
              fontWeight: 500,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "var(--text-muted)",
            }}
          >
            Task
          </div>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="What would you like the agents to do?"
            rows={5}
            style={{
              width: "100%",
              padding: 14,
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
              color: "var(--text-primary)",
              fontSize: 13,
              outline: "none",
              resize: "vertical",
              lineHeight: 1.6,
              fontFamily: "inherit",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "var(--accent)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "var(--border)";
            }}
          />

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={handleSend}
              disabled={
                dispatching || selectedIds.size === 0 || !message.trim()
              }
              className="hover-transition"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "10px 18px",
                backgroundColor: "var(--accent)",
                border: "none",
                borderRadius: "var(--radius-sm)",
                fontSize: 13,
                fontWeight: 500,
                color: "#fff",
                cursor:
                  dispatching || selectedIds.size === 0 || !message.trim()
                    ? "not-allowed"
                    : "pointer",
                opacity:
                  dispatching || selectedIds.size === 0 || !message.trim()
                    ? 0.5
                    : 1,
              }}
              onMouseEnter={(e) => {
                if (
                  !dispatching &&
                  selectedIds.size > 0 &&
                  message.trim()
                ) {
                  e.currentTarget.style.backgroundColor =
                    "var(--accent-hover)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "var(--accent)";
              }}
            >
              <Send size={14} />
              {dispatching
                ? "Sending..."
                : `Send to ${selectedIds.size} agent${selectedIds.size !== 1 ? "s" : ""}`}
            </button>
          </div>
        </div>
      </div>

      {/* Responses */}
      {responses.length > 0 && (
        <div>
          <div
            style={{
              padding: "10px 0",
              fontSize: 11,
              fontWeight: 500,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "var(--text-muted)",
              marginBottom: 8,
            }}
          >
            Responses
          </div>

          <div
            style={{ display: "flex", flexDirection: "column", gap: 10 }}
          >
            {responses.map((r) => (
              <ResponseCard
                key={r.userId}
                userName={r.userName}
                content={r.content}
                status={r.status}
                error={r.error}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
