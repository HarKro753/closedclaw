"use client";

import { useState, useEffect, type FormEvent, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useChat } from "@/hooks/useChat";

export default function ChatPage() {
  const [input, setInput] = useState("");
  const { user, token, loading: authLoading, logout } = useAuth();
  const {
    messages,
    loading: historyLoading,
    sending,
    error,
    messagesEndRef,
    loadHistory,
    sendMessage,
    clearHistory,
  } = useChat(token);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !token) {
      router.replace("/login");
    }
  }, [authLoading, token, router]);

  useEffect(() => {
    if (token) {
      loadHistory();
    }
  }, [token, loadHistory]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    setInput("");
    sendMessage(trimmed);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="loading-dot" />
        <div className="loading-dot" />
        <div className="loading-dot" />
      </div>
    );
  }

  if (!token) return null;

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside
        className="flex w-64 flex-col border-r"
        style={{
          backgroundColor: "var(--bg-secondary)",
          borderColor: "var(--border)",
        }}
      >
        <div className="border-b p-4" style={{ borderColor: "var(--border)" }}>
          <h1 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
            ClosedClaw
          </h1>
          <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
            Your personal AI agent
          </p>
        </div>

        <div className="flex-1 p-4">
          <div className="mb-4">
            <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              {user?.name}
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {user?.email}
            </p>
          </div>

          {user?.isAdmin && (
            <button
              onClick={() => router.push("/admin")}
              className="mb-2 w-full rounded-md border px-3 py-2 text-left text-sm transition-colors"
              style={{
                borderColor: "var(--border)",
                color: "var(--text-secondary)",
              }}
            >
              Admin Panel
            </button>
          )}

          <button
            onClick={clearHistory}
            className="w-full rounded-md border px-3 py-2 text-left text-sm transition-colors"
            style={{
              borderColor: "var(--border)",
              color: "var(--text-secondary)",
            }}
          >
            Clear history
          </button>
        </div>

        <div className="border-t p-4" style={{ borderColor: "var(--border)" }}>
          <button
            onClick={handleLogout}
            className="w-full rounded-md px-3 py-2 text-sm transition-colors"
            style={{
              color: "var(--text-muted)",
            }}
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Chat area */}
      <main className="flex flex-1 flex-col" style={{ backgroundColor: "var(--bg-primary)" }}>
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4">
          {historyLoading ? (
            <div className="flex h-full items-center justify-center gap-1">
              <div className="loading-dot" />
              <div className="loading-dot" />
              <div className="loading-dot" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center">
              <p className="text-lg font-medium" style={{ color: "var(--text-secondary)" }}>
                Start a conversation
              </p>
              <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
                Your agent is ready. Say hello.
              </p>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`animate-fade-in flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className="max-w-[80%] rounded-lg px-4 py-3 text-sm leading-relaxed"
                    style={{
                      backgroundColor:
                        msg.role === "user"
                          ? "var(--accent)"
                          : "var(--bg-secondary)",
                      color: "var(--text-primary)",
                    }}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex justify-start">
                  <div
                    className="flex gap-1 rounded-lg px-4 py-3"
                    style={{ backgroundColor: "var(--bg-secondary)" }}
                  >
                    <div className="loading-dot" />
                    <div className="loading-dot" />
                    <div className="loading-dot" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div
            className="mx-4 mb-2 rounded-md px-3 py-2 text-sm"
            style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "var(--error)" }}
          >
            {error}
          </div>
        )}

        {/* Input */}
        <div className="border-t p-4" style={{ borderColor: "var(--border)" }}>
          <form
            onSubmit={handleSubmit}
            className="mx-auto flex max-w-3xl gap-2"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              rows={1}
              disabled={sending}
              className="flex-1 resize-none rounded-md border px-3 py-2 text-sm outline-none transition-colors focus:border-[var(--accent)] disabled:opacity-50"
              style={{
                backgroundColor: "var(--bg-secondary)",
                borderColor: "var(--border)",
                color: "var(--text-primary)",
              }}
            />
            <button
              type="submit"
              disabled={sending || input.trim().length === 0}
              className="rounded-md px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50"
              style={{ backgroundColor: "var(--accent)" }}
            >
              Send
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
