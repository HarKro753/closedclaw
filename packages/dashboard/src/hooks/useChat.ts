"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { API_BASE_URL } from "@/constants/api";
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

interface SSEChunkEvent {
  type: "chunk";
  content: string;
}

interface SSEDoneEvent {
  type: "done";
}

interface SSEErrorEvent {
  type: "error";
  message: string;
}

type SSEEvent = SSEChunkEvent | SSEDoneEvent | SSEErrorEvent;

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

      const userMessage: ChatMessage = {
        id: `temp-${Date.now()}`,
        role: "user",
        content,
        createdAt: new Date().toISOString(),
      };

      const assistantMessageId = `resp-${Date.now()}`;
      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage, assistantMessage]);
      setSending(true);
      setError(null);

      try {
        const response = await fetch(`${API_BASE_URL}/agent/message/stream`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ message: content }),
        });

        if (!response.ok) {
          const json = (await response.json()) as { error?: string };
          setError(json.error ?? `Request failed with status ${response.status}`);
          setSending(false);
          return;
        }

        const reader = response.body?.getReader();
        if (!reader) {
          setError("Failed to read stream response");
          setSending(false);
          return;
        }

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6);
            try {
              const event = JSON.parse(jsonStr) as SSEEvent;
              if (event.type === "chunk") {
                setMessages((prev) =>
                  prev.map((msg) => {
                    if (msg.id === assistantMessageId) {
                      return { ...msg, content: msg.content + event.content };
                    }
                    return msg;
                  }),
                );
              } else if (event.type === "error") {
                setError(event.message);
              }
            } catch {
              // skip malformed SSE lines
            }
          }
        }
      } catch {
        setError("Network error: unable to reach the server");
      }

      setSending(false);
    },
    [token, sending],
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
