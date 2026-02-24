"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/utils/api";

interface GatewayStatusResponse {
  configured: boolean;
  connected: boolean;
  status: string;
  url?: string;
  message?: string;
}

export function useGatewayStatus(token: string | null, pollIntervalMs = 30000) {
  const [connected, setConnected] = useState<boolean | null>(null);
  const [configured, setConfigured] = useState<boolean>(false);
  const [status, setStatus] = useState<string>("pending");

  const check = useCallback(async () => {
    if (!token) return;

    const { data } = await apiFetch<GatewayStatusResponse>(
      "/agent/gateway-status",
      { token }
    );

    setConnected(data?.connected ?? false);
    setConfigured(data?.configured ?? false);
    setStatus(data?.status ?? "pending");
  }, [token]);

  useEffect(() => {
    check();
    const interval = setInterval(check, pollIntervalMs);
    return () => clearInterval(interval);
  }, [check, pollIntervalMs]);

  return { connected, configured, status, refresh: check };
}
