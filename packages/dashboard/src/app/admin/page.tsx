"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiFetch } from "@/utils/api";

interface AdminUser {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
  createdAt: string;
  active: boolean;
  messageCount: number;
  agentStatus: string;
}

interface UsersResponse {
  users: AdminUser[];
}

export default function AdminPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && (!token || !user?.isAdmin)) {
      router.replace("/chat");
    }
  }, [authLoading, token, user, router]);

  const loadUsers = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    const { data, error: fetchError } = await apiFetch<UsersResponse>(
      "/admin/users",
      { token },
    );

    if (fetchError || !data) {
      setError(fetchError ?? "Failed to load users");
      setLoading(false);
      return;
    }

    setUsers(data.users);
    setLoading(false);
  }, [token]);

  useEffect(() => {
    if (token && user?.isAdmin) {
      loadUsers();
    }
  }, [token, user, loadUsers]);

  async function handleDeactivate(userId: string) {
    if (!token) return;

    const { error: deleteError } = await apiFetch(`/admin/users/${userId}`, {
      method: "DELETE",
      token,
    });

    if (deleteError) {
      setError(deleteError);
      return;
    }

    await loadUsers();
  }

  if (authLoading || loading) {
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
        padding: 32,
        backgroundColor: "var(--bg-base)",
      }}
    >
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <div
          style={{
            marginBottom: 32,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: "var(--text-primary)",
              }}
            >
              Admin Panel
            </h1>
            <p
              style={{
                marginTop: 4,
                fontSize: 13,
                color: "var(--text-muted)",
              }}
            >
              Manage users and their agents
            </p>
          </div>
          <button
            onClick={() => router.push("/chat")}
            className="hover-transition"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
              padding: "8px 14px",
              fontSize: 13,
              color: "var(--text-secondary)",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--bg-hover)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "var(--bg-surface)";
            }}
          >
            <ArrowLeft size={14} />
            Back to Chat
          </button>
        </div>

        {error && (
          <div
            className="animate-fade-in"
            style={{
              marginBottom: 16,
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
                {["User", "Joined", "Messages", "Agent", "Actions"].map((header) => (
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
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr
                  key={u.id}
                  style={{ borderTop: "1px solid var(--border)" }}
                >
                  <td style={{ padding: "12px 16px" }}>
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
                  <td
                    style={{
                      padding: "12px 16px",
                      fontSize: 13,
                      color: "var(--text-secondary)",
                    }}
                  >
                    {u.messageCount}
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
                  <td style={{ padding: "12px 16px" }}>
                    {u.active && !u.isAdmin && (
                      <button
                        onClick={() => handleDeactivate(u.id)}
                        style={{
                          background: "none",
                          border: "none",
                          fontSize: 12,
                          color: "var(--error)",
                          cursor: "pointer",
                          padding: 0,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.textDecoration = "underline";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.textDecoration = "none";
                        }}
                      >
                        Deactivate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
