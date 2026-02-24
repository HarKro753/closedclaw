"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { apiFetch } from "@/utils/api";

interface ChatMessage {
  id: number | string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

interface HistoryResponse {
  messages: ChatMessage[];
}

interface SendResponse {
  response: string;
}

export function useChat(token: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const loadHistory = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    const { data, error: fetchError } = await apiFetch<HistoryResponse>(
      "/agent/history",
      { token }
    );

    if (fetchError || !data) {
      setError(fetchError ?? "Failed to load history");
      setLoading(false);
      return;
    }

    setMessages(data.messages);
    setLoading(false);
  }, [token]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!token || sending) return;

      const optimisticId = `temp-${Date.now()}`;
      const userMessage: ChatMessage = {
        id: optimisticId,
        role: "user",
        content,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setSending(true);
      setError(null);

      const { data, error: sendError } = await apiFetch<SendResponse>(
        "/agent/message",
        {
          method: "POST",
          body: { message: content },
          token,
        }
      );

      if (sendError || !data) {
        setError(sendError ?? "Failed to send message");
        setSending(false);
        return;
      }

      const assistantMessage: ChatMessage = {
        id: `resp-${Date.now()}`,
        role: "assistant",
        content: data.response,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setSending(false);
    },
    [token, sending]
  );

  const clearHistory = useCallback(async () => {
    if (!token) return;

    const { error: clearError } = await apiFetch("/agent/history", {
      method: "DELETE",
      token,
    });

    if (clearError) {
      setError(clearError);
      return;
    }

    setMessages([]);
  }, [token]);

  return {
    messages,
    loading,
    sending,
    error,
    messagesEndRef,
    loadHistory,
    sendMessage,
    clearHistory,
  };
}
