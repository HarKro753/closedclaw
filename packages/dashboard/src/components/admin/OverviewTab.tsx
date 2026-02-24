"use client";

import { useEffect } from "react";
import type { AdminStats, ActivityItem } from "@/hooks/useAdmin";

interface OverviewTabProps {
  stats: AdminStats | null;
  activity: ActivityItem[];
  onLoadStats: () => Promise<void>;
  onLoadActivity: () => Promise<void>;
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div
      style={{
        backgroundColor: "var(--bg-surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)",
        padding: 20,
        flex: 1,
        minWidth: 160,
      }}
    >
      <p
        style={{
          fontSize: 28,
          fontWeight: 700,
          color: "var(--accent)",
          lineHeight: 1.2,
        }}
      >
        {value.toLocaleString()}
      </p>
      <p
        style={{
          fontSize: 12,
          color: "var(--text-muted)",
          marginTop: 4,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {label}
      </p>
    </div>
  );
}

export function OverviewTab({
  stats,
  activity,
  onLoadStats,
  onLoadActivity,
}: OverviewTabProps) {
  useEffect(() => {
    onLoadStats();
    onLoadActivity();
  }, [onLoadStats, onLoadActivity]);

  return (
    <div className="animate-fade-in">
      <div
        style={{
          display: "flex",
          gap: 16,
          marginBottom: 32,
          flexWrap: "wrap",
        }}
      >
        <StatCard label="Total Users" value={stats?.totalUsers ?? 0} />
        <StatCard label="Active Agents" value={stats?.activeAgents ?? 0} />
        <StatCard label="Total Messages" value={stats?.totalMessages ?? 0} />
        <StatCard label="Skills Deployed" value={stats?.skillsDeployed ?? 0} />
      </div>

      <div>
        <h3
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--text-primary)",
            marginBottom: 12,
          }}
        >
          Recent Activity
        </h3>

        {activity.length === 0 && (
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
            No recent activity
          </p>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {activity.map((item) => (
            <div
              key={item.id}
              style={{
                backgroundColor: "var(--bg-surface)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)",
                padding: "10px 14px",
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "var(--radius-full)",
                  backgroundColor:
                    item.role === "user"
                      ? "var(--accent)"
                      : "var(--bg-input)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#fff",
                  flexShrink: 0,
                }}
              >
                {item.userName.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 2,
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 500,
                      color: "var(--text-primary)",
                    }}
                  >
                    {item.userName}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      color: "var(--text-muted)",
                      backgroundColor: "var(--bg-hover)",
                      padding: "1px 6px",
                      borderRadius: "var(--radius-full)",
                    }}
                  >
                    {item.role}
                  </span>
                  <span
                    style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: "auto" }}
                  >
                    {new Date(item.createdAt).toLocaleString()}
                  </span>
                </div>
                <p
                  style={{
                    fontSize: 12,
                    color: "var(--text-secondary)",
                    lineHeight: 1.5,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
