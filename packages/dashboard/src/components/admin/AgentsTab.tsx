"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Eye, Send, UserX, Plus, Settings, X } from "lucide-react";
import { AgentDetailPanel } from "./AgentDetailPanel";
import type { AdminUser, Skill } from "@/hooks/useAdmin";

interface AgentsTabProps {
  users: AdminUser[];
  loading: boolean;
  onLoadUsers: () => Promise<void>;
  onDeactivate: (userId: string) => Promise<boolean>;
  onLoadMemory: (userId: string) => Promise<string>;
  onLoadSkills: (userId: string) => Promise<Skill[]>;
  onSendTask: (userId: string) => void;
  onCreateUser: (params: {
    name: string;
    email: string;
    password?: string;
    gateway_url?: string;
    gateway_token?: string;
    is_admin?: boolean;
  }) => Promise<{ user: { id: string; email: string; name: string }; temporaryPassword?: string } | null>;
  onUpdateGateway: (userId: string, gatewayUrl: string, gatewayToken?: string) => Promise<boolean>;
}

export function AgentsTab({
  users,
  loading,
  onLoadUsers,
  onDeactivate,
  onLoadMemory,
  onLoadSkills,
  onSendTask,
  onCreateUser,
  onUpdateGateway,
}: AgentsTabProps) {
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [gatewayEditUser, setGatewayEditUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    onLoadUsers();
  }, [onLoadUsers]);

  if (loading && users.length === 0) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 60,
          gap: 4,
        }}
      >
        <div className="loading-dot" />
        <div className="loading-dot" />
        <div className="loading-dot" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header with Add User button */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <button
          onClick={() => setShowCreateModal(true)}
          className="hover-transition"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 14px",
            backgroundColor: "var(--accent)",
            border: "none",
            borderRadius: "var(--radius-sm)",
            fontSize: 13,
            fontWeight: 500,
            color: "#fff",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--accent-hover)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "var(--accent)";
          }}
        >
          <Plus size={14} />
          Add User
        </button>
      </div>

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
              {["User", "Status", "Gateway", "Messages", "Last Active", "Actions"].map(
                (header) => (
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
                )
              )}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr
                key={u.id}
                style={{ borderTop: "1px solid var(--border)" }}
              >
                <td style={{ padding: "12px 16px" }}>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "var(--radius-full)",
                        backgroundColor: "var(--accent)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#fff",
                        flexShrink: 0,
                      }}
                    >
                      {u.name.charAt(0).toUpperCase()}
                    </div>
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
                  </div>
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
                        u.agentStatus === "active" || u.agentStatus === "connected"
                          ? "rgba(34,197,94,0.15)"
                          : u.agentStatus === "error"
                            ? "rgba(239,68,68,0.15)"
                            : "rgba(255,255,255,0.05)",
                      color:
                        u.agentStatus === "active" || u.agentStatus === "connected"
                          ? "var(--success)"
                          : u.agentStatus === "error"
                            ? "var(--error)"
                            : "var(--text-muted)",
                    }}
                  >
                    {u.agentStatus}
                  </span>
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <span
                    style={{
                      display: "inline-block",
                      borderRadius: "var(--radius-full)",
                      padding: "2px 8px",
                      fontSize: 12,
                      fontWeight: 500,
                      backgroundColor: u.gatewayConfigured
                        ? "rgba(34,197,94,0.15)"
                        : "rgba(255,255,255,0.05)",
                      color: u.gatewayConfigured
                        ? "var(--success)"
                        : "var(--text-muted)",
                    }}
                  >
                    {u.gatewayConfigured ? "configured" : "none"}
                  </span>
                </td>
                <td
                  style={{
                    padding: "12px 16px",
                    fontSize: 13,
                    color: "var(--text-secondary)",
                  }}
                >
                  {u.messageCount}
                  <span
                    style={{
                      fontSize: 11,
                      color: "var(--text-muted)",
                      marginLeft: 4,
                    }}
                  >
                    {u.messageCount === 1 ? "msg" : "msgs"}
                  </span>
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
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <ActionButton
                      onClick={() => setSelectedUser(u)}
                      title="View Memory"
                    >
                      <Eye size={13} />
                      <span>Memory</span>
                    </ActionButton>
                    <ActionButton
                      onClick={() => setGatewayEditUser(u)}
                      title="Gateway Config"
                    >
                      <Settings size={13} />
                      <span>Gateway</span>
                    </ActionButton>
                    <ActionButton
                      onClick={() => onSendTask(u.id)}
                      title="Send Task"
                    >
                      <Send size={13} />
                      <span>Task</span>
                    </ActionButton>
                    {u.active && !u.isAdmin && (
                      <ActionButton
                        onClick={() => onDeactivate(u.id)}
                        title="Deactivate"
                        variant="danger"
                      >
                        <UserX size={13} />
                      </ActionButton>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedUser && (
        <AgentDetailPanel
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onLoadMemory={onLoadMemory}
          onLoadSkills={onLoadSkills}
        />
      )}

      {showCreateModal && (
        <CreateUserModal
          onClose={() => setShowCreateModal(false)}
          onCreateUser={onCreateUser}
        />
      )}

      {gatewayEditUser && (
        <GatewayEditModal
          user={gatewayEditUser}
          onClose={() => setGatewayEditUser(null)}
          onUpdateGateway={onUpdateGateway}
        />
      )}
    </div>
  );
}

function CreateUserModal({
  onClose,
  onCreateUser,
}: {
  onClose: () => void;
  onCreateUser: AgentsTabProps["onCreateUser"];
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [gatewayUrl, setGatewayUrl] = useState("");
  const [gatewayToken, setGatewayToken] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ temporaryPassword?: string } | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setLocalError(null);

    const data = await onCreateUser({
      name,
      email,
      password: password || undefined,
      gateway_url: gatewayUrl || undefined,
      gateway_token: gatewayToken || undefined,
      is_admin: isAdmin,
    });

    setSubmitting(false);

    if (data) {
      if (data.temporaryPassword) {
        setResult({ temporaryPassword: data.temporaryPassword });
      } else {
        onClose();
      }
    } else {
      setLocalError("Failed to create user");
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="animate-fade-in"
        style={{
          width: "100%",
          maxWidth: 440,
          backgroundColor: "var(--bg-surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-md)",
          padding: 24,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }}>
            Add User
          </h3>
          <button
            onClick={onClose}
            className="hover-transition"
            style={{
              background: "none",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
              padding: 4,
              borderRadius: "var(--radius-sm)",
              display: "flex",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text-secondary)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; }}
          >
            <X size={16} />
          </button>
        </div>

        {result?.temporaryPassword ? (
          <div>
            <div
              style={{
                backgroundColor: "rgba(34,197,94,0.1)",
                color: "var(--success)",
                borderRadius: "var(--radius-sm)",
                padding: "12px",
                fontSize: 13,
                marginBottom: 16,
              }}
            >
              User created successfully
            </div>
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 4 }}>
                Temporary password (share with user):
              </p>
              <code
                style={{
                  display: "block",
                  backgroundColor: "var(--bg-base)",
                  padding: "8px 12px",
                  borderRadius: "var(--radius-sm)",
                  fontSize: 13,
                  color: "var(--text-primary)",
                  wordBreak: "break-all",
                }}
              >
                {result.temporaryPassword}
              </code>
            </div>
            <button
              onClick={onClose}
              className="hover-transition"
              style={{
                width: "100%",
                backgroundColor: "var(--accent)",
                border: "none",
                borderRadius: "var(--radius-sm)",
                color: "#fff",
                padding: "10px 16px",
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--accent-hover)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "var(--accent)"; }}
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {localError && (
              <div
                style={{
                  backgroundColor: "rgba(239,68,68,0.1)",
                  color: "var(--error)",
                  borderRadius: "var(--radius-sm)",
                  padding: "8px 12px",
                  fontSize: 13,
                }}
              >
                {localError}
              </div>
            )}

            <ModalField label="Name *" id="create-name" required value={name} onChange={setName} placeholder="User name" />
            <ModalField label="Email *" id="create-email" required type="email" value={email} onChange={setEmail} placeholder="user@example.com" />
            <ModalField label="Password" id="create-password" type="password" value={password} onChange={setPassword} placeholder="Leave blank to auto-generate" />
            <ModalField label="Gateway URL" id="create-gateway-url" value={gatewayUrl} onChange={setGatewayUrl} placeholder="ws://localhost:18789" />
            <ModalField label="Gateway Token" id="create-gateway-token" type="password" value={gatewayToken} onChange={setGatewayToken} placeholder="Optional" />

            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
              <input
                id="create-is-admin"
                type="checkbox"
                checked={isAdmin}
                onChange={(e) => setIsAdmin(e.target.checked)}
                style={{ accentColor: "var(--accent)" }}
              />
              <label htmlFor="create-is-admin" style={{ fontSize: 13, color: "var(--text-secondary)", cursor: "pointer" }}>
                Admin privileges
              </label>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="hover-transition"
              style={{
                width: "100%",
                backgroundColor: "var(--accent)",
                border: "none",
                borderRadius: "var(--radius-sm)",
                color: "#fff",
                padding: "10px 16px",
                fontSize: 14,
                fontWeight: 500,
                cursor: submitting ? "default" : "pointer",
                opacity: submitting ? 0.5 : 1,
                fontFamily: "inherit",
                marginTop: 4,
              }}
              onMouseEnter={(e) => {
                if (!submitting) e.currentTarget.style.backgroundColor = "var(--accent-hover)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "var(--accent)";
              }}
            >
              {submitting ? "Creating..." : "Create User"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function GatewayEditModal({
  user,
  onClose,
  onUpdateGateway,
}: {
  user: AdminUser;
  onClose: () => void;
  onUpdateGateway: (userId: string, gatewayUrl: string, gatewayToken?: string) => Promise<boolean>;
}) {
  const [gatewayUrl, setGatewayUrl] = useState("");
  const [gatewayToken, setGatewayToken] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!gatewayUrl) {
      setLocalError("Gateway URL is required");
      return;
    }

    setSubmitting(true);
    setLocalError(null);

    const success = await onUpdateGateway(user.id, gatewayUrl, gatewayToken || undefined);
    setSubmitting(false);

    if (success) {
      onClose();
    } else {
      setLocalError("Failed to update gateway");
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="animate-fade-in"
        style={{
          width: "100%",
          maxWidth: 440,
          backgroundColor: "var(--bg-surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-md)",
          padding: 24,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }}>
            Update Gateway for {user.name}
          </h3>
          <button
            onClick={onClose}
            className="hover-transition"
            style={{
              background: "none",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
              padding: 4,
              borderRadius: "var(--radius-sm)",
              display: "flex",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text-secondary)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; }}
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {localError && (
            <div
              style={{
                backgroundColor: "rgba(239,68,68,0.1)",
                color: "var(--error)",
                borderRadius: "var(--radius-sm)",
                padding: "8px 12px",
                fontSize: 13,
              }}
            >
              {localError}
            </div>
          )}

          <ModalField label="URL" id="gw-url" required value={gatewayUrl} onChange={setGatewayUrl} placeholder="ws://localhost:18789" />
          <ModalField label="Token" id="gw-token" type="password" value={gatewayToken} onChange={setGatewayToken} placeholder="Optional authentication token" />

          <button
            type="submit"
            disabled={submitting}
            className="hover-transition"
            style={{
              width: "100%",
              backgroundColor: "var(--accent)",
              border: "none",
              borderRadius: "var(--radius-sm)",
              color: "#fff",
              padding: "10px 16px",
              fontSize: 14,
              fontWeight: 500,
              cursor: submitting ? "default" : "pointer",
              opacity: submitting ? 0.5 : 1,
              fontFamily: "inherit",
              marginTop: 4,
            }}
            onMouseEnter={(e) => {
              if (!submitting) e.currentTarget.style.backgroundColor = "var(--accent-hover)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "var(--accent)";
            }}
          >
            {submitting ? "Saving..." : "Save"}
          </button>
        </form>
      </div>
    </div>
  );
}

function ModalField({
  label,
  id,
  type = "text",
  required = false,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  id: string;
  type?: string;
  required?: boolean;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        style={{
          display: "block",
          marginBottom: 4,
          fontSize: 12,
          fontWeight: 500,
          color: "var(--text-secondary)",
        }}
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%",
          backgroundColor: "var(--bg-input)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-sm)",
          color: "var(--text-primary)",
          padding: "8px 10px",
          fontSize: 13,
          outline: "none",
          transition: "border-color 150ms ease",
          fontFamily: "inherit",
        }}
        onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
      />
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  title,
  variant = "default",
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  variant?: "default" | "danger";
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="hover-transition"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        padding: "4px 8px",
        backgroundColor: "var(--bg-surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-sm)",
        fontSize: 11,
        color: variant === "danger" ? "var(--error)" : "var(--text-secondary)",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "var(--bg-hover)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "var(--bg-surface)";
      }}
    >
      {children}
    </button>
  );
}
