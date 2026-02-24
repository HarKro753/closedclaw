"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useGatewayStatus } from "@/hooks/useGatewayStatus";
import { useGatewayConfig } from "@/hooks/useGatewayConfig";

export default function SettingsPage() {
  const [gatewayUrl, setGatewayUrl] = useState("");
  const [gatewayToken, setGatewayToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [testStatus, setTestStatus] = useState<"idle" | "success" | "error">("idle");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const { user, token, loading: authLoading } = useAuth();
  const { connected, configured, status, refresh } = useGatewayStatus(token);
  const { saving, testing, error, testConnection, saveGateway, clearError } = useGatewayConfig(token);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !token) {
      router.replace("/login");
    }
  }, [authLoading, token, router]);

  async function handleTest() {
    clearError();
    setTestStatus("idle");
    setSaveSuccess(false);
    const success = await testConnection(gatewayUrl, gatewayToken || undefined);
    setTestStatus(success ? "success" : "error");
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    clearError();
    setTestStatus("idle");
    setSaveSuccess(false);
    const success = await saveGateway(gatewayUrl, gatewayToken || undefined);
    if (success) {
      setSaveSuccess(true);
      setTimeout(() => refresh(), 2000);
    }
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

  if (!token) return null;

  const statusColor =
    status === "connected"
      ? "var(--success)"
      : status === "error"
        ? "var(--error)"
        : "var(--text-muted)";

  const statusLabel =
    status === "connected"
      ? "Connected"
      : status === "error"
        ? "Error"
        : "Not configured";

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
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
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
              color: "var(--text-primary)",
            }}
          >
            Settings
          </span>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: 32, maxWidth: 600, width: "100%" }}>
        <h2
          style={{
            fontSize: 18,
            fontWeight: 600,
            color: "var(--text-primary)",
            marginBottom: 24,
          }}
        >
          Gateway Configuration
        </h2>

        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {error && (
            <div
              className="animate-fade-in"
              style={{
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

          {testStatus === "success" && (
            <div
              className="animate-fade-in"
              style={{
                backgroundColor: "rgba(34,197,94,0.1)",
                color: "var(--success)",
                borderRadius: "var(--radius-sm)",
                padding: "8px 12px",
                fontSize: 13,
              }}
            >
              Connection successful
            </div>
          )}

          {saveSuccess && (
            <div
              className="animate-fade-in"
              style={{
                backgroundColor: "rgba(34,197,94,0.1)",
                color: "var(--success)",
                borderRadius: "var(--radius-sm)",
                padding: "8px 12px",
                fontSize: 13,
              }}
            >
              Gateway configuration saved
            </div>
          )}

          <div>
            <label
              htmlFor="gateway-url"
              style={{
                display: "block",
                marginBottom: 6,
                fontSize: 13,
                fontWeight: 500,
                color: "var(--text-secondary)",
              }}
            >
              URL
            </label>
            <input
              id="gateway-url"
              type="text"
              required
              value={gatewayUrl}
              onChange={(e) => { setGatewayUrl(e.target.value); setTestStatus("idle"); setSaveSuccess(false); }}
              placeholder="ws://localhost:18789"
              style={{
                width: "100%",
                backgroundColor: "var(--bg-input)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)",
                color: "var(--text-primary)",
                padding: "10px 12px",
                fontSize: 14,
                outline: "none",
                transition: "border-color 150ms ease",
                fontFamily: "inherit",
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
            />
          </div>

          <div>
            <label
              htmlFor="gateway-token"
              style={{
                display: "block",
                marginBottom: 6,
                fontSize: 13,
                fontWeight: 500,
                color: "var(--text-secondary)",
              }}
            >
              Token
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                id="gateway-token"
                type={showToken ? "text" : "password"}
                value={gatewayToken}
                onChange={(e) => { setGatewayToken(e.target.value); setTestStatus("idle"); setSaveSuccess(false); }}
                placeholder="Optional authentication token"
                style={{
                  flex: 1,
                  backgroundColor: "var(--bg-input)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--text-primary)",
                  padding: "10px 12px",
                  fontSize: 14,
                  outline: "none",
                  transition: "border-color 150ms ease",
                  fontFamily: "inherit",
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="hover-transition"
                style={{
                  backgroundColor: "var(--bg-surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--text-secondary)",
                  padding: "10px 12px",
                  fontSize: 13,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
              >
                {showToken ? "hide" : "show"}
              </button>
            </div>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button
              type="button"
              onClick={handleTest}
              disabled={testing || !gatewayUrl}
              className="hover-transition"
              style={{
                backgroundColor: "var(--bg-surface)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)",
                color: "var(--text-secondary)",
                padding: "10px 16px",
                fontSize: 14,
                fontWeight: 500,
                cursor: testing ? "default" : "pointer",
                opacity: testing ? 0.5 : 1,
                fontFamily: "inherit",
                transition: "background 150ms ease, border-color 150ms ease",
              }}
              onMouseEnter={(e) => {
                if (!testing) e.currentTarget.style.borderColor = "var(--accent)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
              }}
            >
              {testing ? "Testing..." : "Test"}
            </button>

            <button
              type="submit"
              disabled={saving || !gatewayUrl}
              className="hover-transition"
              style={{
                backgroundColor: "var(--accent)",
                border: "none",
                borderRadius: "var(--radius-sm)",
                color: "#fff",
                padding: "10px 16px",
                fontSize: 14,
                fontWeight: 500,
                cursor: saving ? "default" : "pointer",
                opacity: saving ? 0.5 : 1,
                fontFamily: "inherit",
                transition: "background 150ms ease, opacity 150ms ease",
              }}
              onMouseEnter={(e) => {
                if (!saving) e.currentTarget.style.backgroundColor = "var(--accent-hover)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "var(--accent)";
              }}
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>

          {/* Status indicator */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "12px 0",
              fontSize: 13,
              color: "var(--text-secondary)",
            }}
          >
            <span>Status:</span>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: statusColor,
              }}
            />
            <span style={{ color: statusColor, fontWeight: 500 }}>{statusLabel}</span>
          </div>
        </form>
      </div>
    </div>
  );
}
