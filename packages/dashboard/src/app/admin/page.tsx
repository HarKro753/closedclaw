"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
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
          padding: "16px 32px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button
            onClick={() => router.push("/chat")}
            className="hover-transition"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "none",
              border: "none",
              fontSize: 13,
              color: "var(--text-secondary)",
              cursor: "pointer",
              padding: "4px 8px",
              borderRadius: "var(--radius-sm)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--text-secondary)";
            }}
          >
            <ArrowLeft size={14} />
            Back
          </button>
          <h1
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "var(--text-primary)",
            }}
          >
            Admin Dashboard
          </h1>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 2 }}>
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
                padding: "6px 14px",
                backgroundColor:
                  activeTab === tab.id
                    ? "var(--bg-surface)"
                    : "transparent",
                border:
                  activeTab === tab.id
                    ? "1px solid var(--border)"
                    : "1px solid transparent",
                borderRadius: "var(--radius-sm)",
                fontSize: 13,
                fontWeight: activeTab === tab.id ? 500 : 400,
                color:
                  activeTab === tab.id
                    ? "var(--text-primary)"
                    : "var(--text-secondary)",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.backgroundColor = "transparent";
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
