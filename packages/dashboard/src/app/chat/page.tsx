"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useChat } from "@/hooks/useChat";
import { useGatewayStatus } from "@/hooks/useGatewayStatus";
import { Sidebar } from "@/components/Sidebar";
import { ChatWelcome } from "@/components/ChatWelcome";
import { MessageBubble } from "@/components/MessageBubble";
import { ChatInput } from "@/components/ChatInput";
import { StreamingDots } from "@/components/StreamingDots";
import { GatewayOfflineBanner } from "@/components/GatewayOfflineBanner";

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
  const { connected: gatewayConnected } = useGatewayStatus(token);
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

  function handleSuggestionClick(text: string) {
    setInput(text);
  }

  function handleNewChat() {
    clearHistory();
  }

  function handleLogout() {
    logout();
    router.replace("/login");
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

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <Sidebar
        userName={user?.name}
        userEmail={user?.email}
        isAdmin={user?.isAdmin ?? false}
        gatewayConnected={gatewayConnected}
        onNewChat={handleNewChat}
        onLogout={handleLogout}
      />

      {/* Chat area */}
      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          backgroundColor: "var(--bg-base)",
          minWidth: 0,
        }}
      >
        {/* Gateway offline banner */}
        <GatewayOfflineBanner visible={gatewayConnected === false} />

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {historyLoading ? (
            <div
              style={{
                display: "flex",
                height: "100%",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
              }}
            >
              <div className="loading-dot" />
              <div className="loading-dot" />
              <div className="loading-dot" />
            </div>
          ) : messages.length === 0 ? (
            <ChatWelcome
              userName={user?.name}
              onSuggestionClick={handleSuggestionClick}
            />
          ) : (
            <div
              style={{
                maxWidth: 768,
                margin: "0 auto",
                padding: "24px 24px 0",
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  role={msg.role}
                  content={msg.content}
                  testId={msg.role === "user" ? "user-message" : "agent-message"}
                />
              ))}
              {sending && <StreamingDots />}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              margin: "0 24px 8px",
              maxWidth: 768,
              alignSelf: "center",
              width: "100%",
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

        {/* Input */}
        <ChatInput
          value={input}
          onChange={setInput}
          onSubmit={handleSubmit}
          disabled={sending}
        />
      </main>
    </div>
  );
}
