"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/utils/api";

interface User {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
  createdAt?: string;
}

interface AuthSignupResponse {
  token: string;
  user: User;
}

interface AuthLoginResponse {
  token: string;
  user: User;
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const savedToken = localStorage.getItem("closedclaw_token");
    const savedUser = localStorage.getItem("closedclaw_user");

    if (savedToken && savedUser) {
      try {
        const user = JSON.parse(savedUser) as User;
        setState({ user, token: savedToken, loading: false, error: null });
        return;
      } catch {
        localStorage.removeItem("closedclaw_token");
        localStorage.removeItem("closedclaw_user");
      }
    }

    setState((prev) => ({ ...prev, loading: false }));
  }, []);

  const signup = useCallback(
    async (email: string, password: string, name: string) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const { data, error } = await apiFetch<AuthSignupResponse>(
        "/auth/signup",
        {
          method: "POST",
          body: { email, password, name },
        }
      );

      if (error || !data) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: error ?? "Signup failed",
        }));
        return false;
      }

      localStorage.setItem("closedclaw_token", data.token);
      localStorage.setItem("closedclaw_user", JSON.stringify(data.user));

      setState({
        user: data.user,
        token: data.token,
        loading: false,
        error: null,
      });

      return true;
    },
    []
  );

  const login = useCallback(async (email: string, password: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    const { data, error } = await apiFetch<AuthLoginResponse>("/auth/login", {
      method: "POST",
      body: { email, password },
    });

    if (error || !data) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error ?? "Login failed",
      }));
      return false;
    }

    localStorage.setItem("closedclaw_token", data.token);
    localStorage.setItem("closedclaw_user", JSON.stringify(data.user));

    setState({
      user: data.user,
      token: data.token,
      loading: false,
      error: null,
    });

    return true;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("closedclaw_token");
    localStorage.removeItem("closedclaw_user");
    setState({ user: null, token: null, loading: false, error: null });
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    user: state.user,
    token: state.token,
    loading: state.loading,
    error: state.error,
    signup,
    login,
    logout,
    clearError,
  };
}
