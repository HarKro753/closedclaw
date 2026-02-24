"use client";

import { useState, useCallback } from "react";
import { apiFetch } from "@/utils/api";

interface TestResult {
  success: boolean;
  message: string;
}

interface SaveResult {
  success: boolean;
}

export function useGatewayConfig(token: string | null) {
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testConnection = useCallback(
    async (gatewayUrl: string, gatewayToken?: string): Promise<boolean> => {
      if (!token) return false;
      setTesting(true);
      setError(null);

      const { data, error: fetchError } = await apiFetch<TestResult>(
        "/agent/gateway/test",
        {
          method: "POST",
          body: { gateway_url: gatewayUrl, gateway_token: gatewayToken },
          token,
        }
      );

      setTesting(false);

      if (fetchError) {
        setError(fetchError);
        return false;
      }

      if (!data?.success) {
        setError(data?.message ?? "Connection test failed");
        return false;
      }

      return true;
    },
    [token]
  );

  const saveGateway = useCallback(
    async (gatewayUrl: string, gatewayToken?: string): Promise<boolean> => {
      if (!token) return false;
      setSaving(true);
      setError(null);

      const { error: fetchError } = await apiFetch<SaveResult>(
        "/agent/gateway",
        {
          method: "PATCH",
          body: { gateway_url: gatewayUrl, gateway_token: gatewayToken },
          token,
        }
      );

      setSaving(false);

      if (fetchError) {
        setError(fetchError);
        return false;
      }

      return true;
    },
    [token]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { saving, testing, error, testConnection, saveGateway, clearError };
}
