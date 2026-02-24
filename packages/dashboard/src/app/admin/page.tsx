"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
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
      <div className="flex h-screen items-center justify-center">
        <div className="loading-dot" />
        <div className="loading-dot" />
        <div className="loading-dot" />
      </div>
    );
  }

  if (!user?.isAdmin) return null;

  return (
    <div
      className="min-h-screen p-8"
      style={{ backgroundColor: "var(--bg-primary)" }}
    >
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1
              className="text-2xl font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              Admin Panel
            </h1>
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
              Manage users and their agents
            </p>
          </div>
          <button
            onClick={() => router.push("/chat")}
            className="rounded-md border px-4 py-2 text-sm transition-colors"
            style={{
              borderColor: "var(--border)",
              color: "var(--text-secondary)",
            }}
          >
            Back to Chat
          </button>
        </div>

        {error && (
          <div
            className="mb-4 rounded-md px-3 py-2 text-sm"
            style={{
              backgroundColor: "rgba(239,68,68,0.1)",
              color: "var(--error)",
            }}
          >
            {error}
          </div>
        )}

        <div
          className="overflow-hidden rounded-lg border"
          style={{ borderColor: "var(--border)" }}
        >
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: "var(--bg-secondary)" }}>
                <th
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  style={{ color: "var(--text-muted)" }}
                >
                  User
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  style={{ color: "var(--text-muted)" }}
                >
                  Joined
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  style={{ color: "var(--text-muted)" }}
                >
                  Messages
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  style={{ color: "var(--text-muted)" }}
                >
                  Agent
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  style={{ color: "var(--text-muted)" }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr
                  key={u.id}
                  className="border-t"
                  style={{ borderColor: "var(--border)" }}
                >
                  <td className="px-4 py-3">
                    <div>
                      <p
                        className="text-sm font-medium"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {u.name}
                        {u.isAdmin && (
                          <span
                            className="ml-2 rounded-full px-2 py-0.5 text-xs"
                            style={{
                              backgroundColor: "rgba(109,40,217,0.2)",
                              color: "var(--accent)",
                            }}
                          >
                            Admin
                          </span>
                        )}
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {u.email}
                      </p>
                    </div>
                  </td>
                  <td
                    className="px-4 py-3 text-sm"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td
                    className="px-4 py-3 text-sm"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {u.messageCount}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-block rounded-full px-2 py-0.5 text-xs font-medium"
                      style={{
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
                  <td className="px-4 py-3">
                    {u.active && !u.isAdmin && (
                      <button
                        onClick={() => handleDeactivate(u.id)}
                        className="text-xs transition-colors hover:underline"
                        style={{ color: "var(--error)" }}
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
