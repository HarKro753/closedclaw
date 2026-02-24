"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { OverviewTab } from "@/components/admin/OverviewTab";
import { AgentsTab } from "@/components/admin/AgentsTab";
import { SkillsTab } from "@/components/admin/SkillsTab";
import { DispatchTab } from "@/components/admin/DispatchTab";

type AdminTab = "overview" | "agents" | "skills" | "dispatch";

const TABS: Array<{ id: AdminTab; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "agents", label: "Agents" },
  { id: "skills", label: "Skills" },
  { id: "dispatch", label: "Dispatch" },
];

const TAB_LABELS: Record<AdminTab, string> = {
  overview: "Overview",
  agents: "Agents",
  skills: "Skills",
  dispatch: "Dispatch",
};

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [dispatchPreselectedUserId, setDispatchPreselectedUserId] = useState<string | null>(null);
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();

  const {
    users,
    stats,
    activity,
    loading,
    error,
    loadUsers,
    loadStats,
    loadActivity,
    deactivateUser,
    loadAgentSkills,
    loadAgentMemory,
    clearError,
  } = useAdmin(token);

  useEffect(() => {
    if (!authLoading && (!token || !user?.isAdmin)) {
      router.replace("/chat");
    }
  }, [authLoading, token, user, router]);

  function handleSendTask(userId: string) {
    setDispatchPreselectedUserId(userId);
    setActiveTab("dispatch");
  }

  if (authLoading) {
    return (
      <div
        style={{
          display: "flex",
          height: "100vh",
          alignItems: "center",
          justifyContent: "center",
          gap: 4,
          backgroundColor: "var(--bg-base)",
        }}
      >
        <div className="loading-dot" />
        <div className="loading-dot" />
        <div className="loading-dot" />
      </div>
    );
  }

  if (!user?.isAdmin) return null;

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--bg-base)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px 32px 0",
          borderBottom: "1px solid var(--border)",
        }}
      >
        {/* Breadcrumb */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 16,
          }}
        >
          <button
            onClick={() => router.push("/chat")}
            className="hover-transition"
            style={{
              background: "none",
              border: "none",
              fontSize: 14,
              fontWeight: 600,
              color: "var(--text-secondary)",
              cursor: "pointer",
              padding: 0,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--text-secondary)";
            }}
          >
            <span style={{ fontSize: 16 }}>&#x25C8;</span>
            ClosedClaw
          </button>
          <ChevronRight size={14} style={{ color: "var(--text-muted)" }} />
          <span
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: "var(--text-secondary)",
            }}
          >
            Admin
          </span>
          <ChevronRight size={14} style={{ color: "var(--text-muted)" }} />
          <span
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: "var(--text-primary)",
            }}
          >
            {TAB_LABELS[activeTab]}
          </span>
        </div>

        {/* Tab bar — underline style */}
        <div style={{ display: "flex", gap: 24 }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.id !== "dispatch") {
                  setDispatchPreselectedUserId(null);
                }
                clearError();
              }}
              className="hover-transition"
              style={{
                padding: "8px 0",
                background: "none",
                border: "none",
                borderBottom:
                  activeTab === tab.id
                    ? "2px solid var(--accent)"
                    : "2px solid transparent",
                fontSize: 13,
                fontWeight: activeTab === tab.id ? 500 : 400,
                color:
                  activeTab === tab.id
                    ? "var(--text-primary)"
                    : "var(--text-secondary)",
                cursor: "pointer",
                marginBottom: -1,
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.color = "var(--text-primary)";
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.color = "var(--text-secondary)";
                }
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div
          className="animate-fade-in"
          style={{
            margin: "16px 32px 0",
            backgroundColor: "rgba(239,68,68,0.1)",
            color: "var(--error)",
            borderRadius: "var(--radius-sm)",
            padding: "8px 12px",
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      {/* Tab content */}
      <div style={{ flex: 1, padding: 32, maxWidth: 1200, width: "100%" }}>
        {activeTab === "overview" && (
          <OverviewTab
            stats={stats}
            activity={activity}
            onLoadStats={loadStats}
            onLoadActivity={loadActivity}
          />
        )}

        {activeTab === "agents" && (
          <AgentsTab
            users={users}
            loading={loading}
            onLoadUsers={loadUsers}
            onDeactivate={deactivateUser}
            onLoadMemory={loadAgentMemory}
            onLoadSkills={loadAgentSkills}
            onSendTask={handleSendTask}
          />
        )}

        {activeTab === "skills" && (
          <SkillsTab token={token} users={users} />
        )}

        {activeTab === "dispatch" && (
          <DispatchTab
            users={users}
            token={token}
            preselectedUserId={dispatchPreselectedUserId}
            onLoadUsers={loadUsers}
          />
        )}
      </div>
    </div>
  );
}
