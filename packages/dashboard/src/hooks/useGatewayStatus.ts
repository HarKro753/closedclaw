"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/utils/api";

interface GatewayStatusResponse {
  connected: boolean;
}

export function useGatewayStatus(token: string | null, pollIntervalMs = 30000) {
  const [connected, setConnected] = useState<boolean | null>(null);

  const check = useCallback(async () => {
    if (!token) return;

    const { data } = await apiFetch<GatewayStatusResponse>(
      "/agent/gateway-status",
      { token }
    );

    setConnected(data?.connected ?? false);
  }, [token]);

  useEffect(() => {
    check();
    const interval = setInterval(check, pollIntervalMs);
    return () => clearInterval(interval);
  }, [check, pollIntervalMs]);

  return { connected };
}
