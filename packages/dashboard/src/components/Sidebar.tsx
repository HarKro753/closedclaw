"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SquarePen, Search, LogOut, Shield } from "lucide-react";

interface SidebarProps {
  userName: string | undefined;
  userEmail: string | undefined;
  isAdmin: boolean;
  onNewChat: () => void;
  onLogout: () => void;
}

export function Sidebar({ userName, userEmail, isAdmin, onNewChat, onLogout }: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const initials = userName ? userName.charAt(0).toUpperCase() : "?";

  return (
    <aside
      style={{
        width: 240,
        minWidth: 240,
        backgroundColor: "var(--bg-sidebar)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 18, color: "var(--text-primary)" }}>&#x2B21;</span>
          <span
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: "var(--text-primary)",
            }}
          >
            ClosedClaw
          </span>
        </div>
        <button
          onClick={onNewChat}
          className="hover-transition"
          style={{
            background: "none",
            border: "none",
            color: "var(--text-secondary)",
            cursor: "pointer",
            padding: 6,
            borderRadius: "var(--radius-sm)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          title="New Chat"
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--bg-hover)";
            e.currentTarget.style.color = "var(--text-primary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.color = "var(--text-secondary)";
          }}
        >
          <SquarePen size={18} />
        </button>
      </div>

      {/* Search */}
      <div style={{ padding: "0 12px 12px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            backgroundColor: "var(--bg-surface)",
            borderRadius: "var(--radius-full)",
            padding: "6px 12px",
          }}
        >
          <Search size={14} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: "none",
              border: "none",
              outline: "none",
              color: "var(--text-primary)",
              fontSize: 13,
              width: "100%",
            }}
          />
        </div>
      </div>

      {/* Chat history */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 8px" }}>
        <p
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            padding: "12px 8px 8px",
          }}
        >
          Recent
        </p>
        <p
          style={{
            fontSize: 13,
            color: "var(--text-muted)",
            padding: "8px",
          }}
        >
          No chats yet
        </p>
      </div>

      {/* Admin button */}
      {isAdmin && (
        <div style={{ padding: "0 8px 4px" }}>
          <button
            onClick={() => router.push("/admin")}
            className="hover-transition"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              width: "100%",
              padding: "8px",
              background: "none",
              border: "none",
              borderRadius: "var(--radius-sm)",
              color: "var(--text-secondary)",
              fontSize: 13,
              cursor: "pointer",
              textAlign: "left",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--bg-hover)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <Shield size={14} />
            Admin Panel
          </button>
        </div>
      )}

      {/* User profile */}
      <div
        style={{
          padding: 12,
          borderTop: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
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
          {initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: "var(--text-primary)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {userName}
          </p>
          <p
            style={{
              fontSize: 11,
              color: "var(--text-muted)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {userEmail}
          </p>
        </div>
        <button
          onClick={onLogout}
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
            justifyContent: "center",
            flexShrink: 0,
          }}
          title="Sign out"
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--text-secondary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--text-muted)";
          }}
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}
