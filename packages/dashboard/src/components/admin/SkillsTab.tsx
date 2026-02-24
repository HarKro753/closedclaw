"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Search, X, Save, Trash2 } from "lucide-react";
import { SkillCard } from "./SkillCard";
import { apiFetch } from "@/utils/api";
import type { AdminUser } from "@/hooks/useAdmin";

interface Skill {
  name: string;
  content: string;
}

interface SkillsResponse {
  skills: Skill[];
}

interface SkillsTabProps {
  token: string | null;
  users: AdminUser[];
}

export function SkillsTab({ token, users }: SkillsTabProps) {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadSkills = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    const { data, error: fetchError } = await apiFetch<SkillsResponse>(
      "/skills",
      { token }
    );

    if (fetchError || !data) {
      setError(fetchError ?? "Failed to load skills");
      setLoading(false);
      return;
    }

    setSkills(data.skills);
    setLoading(false);
  }, [token]);

  useEffect(() => {
    loadSkills();
  }, [loadSkills]);

  async function handleCreate(name: string, content: string) {
    if (!token) return;

    const { error: createError } = await apiFetch("/skills", {
      method: "POST",
      token,
      body: { name, content },
    });

    if (createError) {
      setError(createError);
      return;
    }

    setShowCreateModal(false);
    await loadSkills();
  }

  async function handleSaveEdit(name: string, content: string) {
    if (!token) return;

    await apiFetch(`/skills/${name}`, {
      method: "DELETE",
      token,
    });

    const { error: createError } = await apiFetch("/skills", {
      method: "POST",
      token,
      body: { name, content },
    });

    if (createError) {
      setError(createError);
      return;
    }

    setEditingSkill(null);
    await loadSkills();
  }

  async function handleDelete(name: string) {
    if (!token) return;

    const { error: deleteError } = await apiFetch(`/skills/${name}`, {
      method: "DELETE",
      token,
    });

    if (deleteError) {
      setError(deleteError);
      return;
    }

    setEditingSkill(null);
    await loadSkills();
  }

  async function handleDeployToAll(skillName: string) {
    if (!token) return;

    const skill = skills.find((s) => s.name === skillName);
    if (!skill) return;

    const activeUsers = users.filter(
      (u) => u.active && u.agentStatus === "active"
    );

    let successCount = 0;
    for (const user of activeUsers) {
      const { error: deployError } = await apiFetch("/skills/agent", {
        method: "POST",
        token,
        body: { name: skill.name, content: skill.content, userId: user.id },
      });

      if (!deployError) {
        successCount++;
      }
    }

    setError(
      successCount === activeUsers.length
        ? null
        : `Deployed to ${successCount}/${activeUsers.length} agents`
    );
  }

  const filteredSkills = skills.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
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

  if (editingSkill) {
    return (
      <SkillEditor
        skill={editingSkill}
        onSave={handleSaveEdit}
        onDelete={handleDelete}
        onCancel={() => setEditingSkill(null)}
      />
    );
  }

  return (
    <div className="animate-fade-in">
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
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
          gap: 12,
        }}
      >
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
          New Skill
        </button>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            backgroundColor: "var(--bg-surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-full)",
            padding: "6px 12px",
            width: 240,
          }}
        >
          <Search
            size={14}
            style={{ color: "var(--text-muted)", flexShrink: 0 }}
          />
          <input
            type="text"
            placeholder="Search skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: "none",
              border: "none",
              outline: "none",
              color: "var(--text-primary)",
              fontSize: 13,
              width: "100%",
            }}
          />
        </div>
      </div>

      {filteredSkills.length === 0 ? (
        <p style={{ fontSize: 13, color: "var(--text-muted)", padding: 20 }}>
          {searchQuery ? "No skills match your search" : "No skills created yet"}
        </p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 16,
          }}
        >
          {filteredSkills.map((skill) => (
            <SkillCard
              key={skill.name}
              name={skill.name}
              content={skill.content}
              onEdit={() => setEditingSkill(skill)}
              onDeployToAll={handleDeployToAll}
            />
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateSkillModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  );
}

function CreateSkillModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (name: string, content: string) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    if (!name.trim() || !content.trim()) return;
    setSaving(true);
    await onCreate(name.trim(), content.trim());
    setSaving(false);
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
          backgroundColor: "var(--bg-sidebar)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          padding: 24,
          width: 480,
          maxWidth: "90vw",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 20,
          }}
        >
          <h3
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: "var(--text-primary)",
            }}
          >
            Create New Skill
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
              padding: 4,
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label
            style={{
              display: "block",
              fontSize: 12,
              color: "var(--text-muted)",
              marginBottom: 6,
            }}
          >
            Skill Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. github, notion, travel"
            style={{
              width: "100%",
              padding: "8px 12px",
              backgroundColor: "var(--bg-input)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
              color: "var(--text-primary)",
              fontSize: 13,
              outline: "none",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "var(--accent)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "var(--border)";
            }}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label
            style={{
              display: "block",
              fontSize: 12,
              color: "var(--text-muted)",
              marginBottom: 6,
            }}
          >
            Content (Markdown)
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write skill instructions in markdown..."
            rows={8}
            style={{
              width: "100%",
              padding: "8px 12px",
              backgroundColor: "var(--bg-input)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
              color: "var(--text-primary)",
              fontSize: 13,
              outline: "none",
              resize: "vertical",
              lineHeight: 1.6,
              fontFamily: "inherit",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "var(--accent)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "var(--border)";
            }}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button
            onClick={onClose}
            className="hover-transition"
            style={{
              padding: "8px 16px",
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
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
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !name.trim() || !content.trim()}
            className="hover-transition"
            style={{
              padding: "8px 16px",
              backgroundColor: "var(--accent)",
              border: "none",
              borderRadius: "var(--radius-sm)",
              fontSize: 13,
              fontWeight: 500,
              color: "#fff",
              cursor:
                saving || !name.trim() || !content.trim()
                  ? "not-allowed"
                  : "pointer",
              opacity:
                saving || !name.trim() || !content.trim() ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              if (!saving && name.trim() && content.trim()) {
                e.currentTarget.style.backgroundColor = "var(--accent-hover)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "var(--accent)";
            }}
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SkillEditor({
  skill,
  onSave,
  onDelete,
  onCancel,
}: {
  skill: Skill;
  onSave: (name: string, content: string) => Promise<void>;
  onDelete: (name: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [content, setContent] = useState(skill.content);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await onSave(skill.name, content);
    setSaving(false);
  }

  async function handleDelete() {
    setSaving(true);
    await onDelete(skill.name);
    setSaving(false);
  }

  return (
    <div className="animate-fade-in">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <h3
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: "var(--text-primary)",
          }}
        >
          Editing: {skill.name}
        </h3>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={handleDelete}
            disabled={saving}
            className="hover-transition"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "6px 12px",
              backgroundColor: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: "var(--radius-sm)",
              fontSize: 12,
              color: "var(--error)",
              cursor: saving ? "not-allowed" : "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.1)";
            }}
          >
            <Trash2 size={12} />
            Delete
          </button>
          <button
            onClick={onCancel}
            className="hover-transition"
            style={{
              padding: "6px 12px",
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
              fontSize: 12,
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
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="hover-transition"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "6px 12px",
              backgroundColor: "var(--accent)",
              border: "none",
              borderRadius: "var(--radius-sm)",
              fontSize: 12,
              fontWeight: 500,
              color: "#fff",
              cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              if (!saving) {
                e.currentTarget.style.backgroundColor = "var(--accent-hover)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "var(--accent)";
            }}
          >
            <Save size={12} />
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={20}
        style={{
          width: "100%",
          padding: 16,
          backgroundColor: "var(--bg-surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-md)",
          color: "var(--text-primary)",
          fontSize: 13,
          outline: "none",
          resize: "vertical",
          lineHeight: 1.6,
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "var(--accent)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "var(--border)";
        }}
      />
    </div>
  );
}
