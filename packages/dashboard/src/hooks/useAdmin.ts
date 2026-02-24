"use client";

import { useState, useCallback } from "react";
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

interface AdminStats {
  totalUsers: number;
  activeAgents: number;
  totalMessages: number;
  skillsDeployed: number;
}

interface ActivityItem {
  id: number;
  userId: string;
  role: string;
  content: string;
  createdAt: string;
  userName: string;
  userEmail: string;
}

interface Skill {
  name: string;
  content: string;
}

interface UsersResponse {
  users: AdminUser[];
}

interface StatsResponse {
  totalUsers: number;
  activeAgents: number;
  totalMessages: number;
  skillsDeployed: number;
}

interface ActivityResponse {
  activity: ActivityItem[];
}

interface SkillsResponse {
  skills: Skill[];
}

interface MemoryResponse {
  memory: string;
}

export function useAdmin(token: string | null) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    const { data, error: fetchError } = await apiFetch<UsersResponse>(
      "/admin/users",
      { token }
    );

    if (fetchError || !data) {
      setError(fetchError ?? "Failed to load users");
      setLoading(false);
      return;
    }

    setUsers(data.users);
    setLoading(false);
  }, [token]);

  const loadStats = useCallback(async () => {
    if (!token) return;

    const { data, error: fetchError } = await apiFetch<StatsResponse>(
      "/admin/stats",
      { token }
    );

    if (fetchError || !data) {
      setError(fetchError ?? "Failed to load stats");
      return;
    }

    setStats(data);
  }, [token]);

  const loadActivity = useCallback(async () => {
    if (!token) return;

    const { data, error: fetchError } = await apiFetch<ActivityResponse>(
      "/admin/activity",
      { token }
    );

    if (fetchError || !data) {
      setError(fetchError ?? "Failed to load activity");
      return;
    }

    setActivity(data.activity);
  }, [token]);

  const deactivateUser = useCallback(
    async (userId: string) => {
      if (!token) return false;

      const { error: deleteError } = await apiFetch(
        `/admin/users/${userId}`,
        { method: "DELETE", token }
      );

      if (deleteError) {
        setError(deleteError);
        return false;
      }

      await loadUsers();
      return true;
    },
    [token, loadUsers]
  );

  const loadAgentSkills = useCallback(
    async (userId: string): Promise<Skill[]> => {
      if (!token) return [];

      const { data, error: fetchError } = await apiFetch<SkillsResponse>(
        `/admin/agents/${userId}/skills`,
        { token }
      );

      if (fetchError || !data) {
        return [];
      }

      return data.skills;
    },
    [token]
  );

  const loadAgentMemory = useCallback(
    async (userId: string): Promise<string> => {
      if (!token) return "";

      const { data, error: fetchError } = await apiFetch<MemoryResponse>(
        `/admin/agents/${userId}/memory`,
        { token }
      );

      if (fetchError || !data) {
        return "";
      }

      return data.memory;
    },
    [token]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
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
  };
}

export type { AdminUser, AdminStats, ActivityItem, Skill };
