"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useGatewayConfig } from "@/hooks/useGatewayConfig";

export default function SetupPage() {
  const [gatewayUrl, setGatewayUrl] = useState("ws://localhost:18789");
  const [gatewayToken, setGatewayToken] = useState("");
  const [testStatus, setTestStatus] = useState<"idle" | "success" | "error">("idle");
  const { user, token, loading: authLoading, updateUser } = useAuth();
  const { saving, testing, error, testConnection, saveGateway, clearError } = useGatewayConfig(token);
  const router = useRouter();

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

  if (!token) {
    router.replace("/login");
    return null;
  }

  async function handleTest() {
    clearError();
    setTestStatus("idle");
    const success = await testConnection(gatewayUrl, gatewayToken || undefined);
    setTestStatus(success ? "success" : "error");
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    clearError();
    const success = await saveGateway(gatewayUrl, gatewayToken || undefined);
    if (success) {
      updateUser({ gatewayConfigured: true, gatewayStatus: "pending" });
      router.push("/chat");
    }
  }

  function handleSkip() {
    router.push("/chat");
  }

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        backgroundColor: "var(--bg-base)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          backgroundColor: "var(--bg-surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-md)",
          padding: 32,
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "var(--text-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <span style={{ fontSize: 20 }}>&#x25C8;</span>
            ClosedClaw
          </h1>
          <h2
            style={{
              marginTop: 16,
              fontSize: 18,
              fontWeight: 600,
              color: "var(--text-primary)",
            }}
          >
            Connect Your OpenClaw Gateway
          </h2>
          <p
            style={{
              marginTop: 8,
              fontSize: 14,
              color: "var(--text-secondary)",
              lineHeight: 1.5,
            }}
          >
            Every agent runs on its own OpenClaw instance. Enter your Gateway details to get started.
          </p>
        </div>

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
              Gateway URL
            </label>
            <input
              id="gateway-url"
              type="text"
              required
              value={gatewayUrl}
              onChange={(e) => { setGatewayUrl(e.target.value); setTestStatus("idle"); }}
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
              Auth Token (optional)
            </label>
            <input
              id="gateway-token"
              type="password"
              value={gatewayToken}
              onChange={(e) => { setGatewayToken(e.target.value); setTestStatus("idle"); }}
              placeholder="Optional authentication token"
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

          <div style={{ display: "flex", gap: 12 }}>
            <button
              type="button"
              onClick={handleTest}
              disabled={testing || !gatewayUrl}
              className="hover-transition"
              style={{
                flex: 1,
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
              {testing ? "Testing..." : "Test Connection"}
            </button>

            <button
              type="submit"
              disabled={saving}
              className="hover-transition"
              style={{
                flex: 1,
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
              {saving ? "Saving..." : "Save & Continue"}
            </button>
          </div>

          <button
            type="button"
            onClick={handleSkip}
            className="hover-transition"
            style={{
              background: "none",
              border: "none",
              color: "var(--text-muted)",
              fontSize: 13,
              cursor: "pointer",
              padding: "8px 0",
              fontFamily: "inherit",
              textAlign: "center",
              transition: "color 150ms ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--text-secondary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--text-muted)";
            }}
          >
            Skip for now
          </button>
        </form>
      </div>
    </div>
  );
}
