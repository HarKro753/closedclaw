"use client";

import { useState, useCallback } from "react";
import { API_BASE_URL } from "@/constants/api";

type ResponseStatus = "pending" | "streaming" | "done" | "error";

interface AgentResponse {
  userId: string;
  userName: string;
  content: string;
  status: ResponseStatus;
  error?: string;
}

interface SSEChunkEvent {
  type: "chunk";
  content: string;
}

interface SSEDoneEvent {
  type: "done";
  taskId?: string;
}

interface SSEErrorEvent {
  type: "error";
  message: string;
}

type SSEEvent = SSEChunkEvent | SSEDoneEvent | SSEErrorEvent;

export function useTaskDispatch(token: string | null) {
  const [responses, setResponses] = useState<AgentResponse[]>([]);
  const [dispatching, setDispatching] = useState(false);

  const dispatchTask = useCallback(
    async (
      agents: Array<{ id: string; name: string }>,
      message: string
    ) => {
      if (!token || dispatching) return;

      setDispatching(true);

      const initialResponses: AgentResponse[] = agents.map((agent) => ({
        userId: agent.id,
        userName: agent.name,
        content: "",
        status: "pending" as const,
      }));

      setResponses(initialResponses);

      const streamPromises = agents.map(async (agent) => {
        setResponses((prev) =>
          prev.map((r) => {
            if (r.userId === agent.id) {
              return { ...r, status: "streaming" as const };
            }
            return r;
          })
        );

        try {
          const response = await fetch(
            `${API_BASE_URL}/admin/agents/${agent.id}/message/stream`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ message }),
            }
          );

          if (!response.ok) {
            const json = (await response.json()) as { error?: string };
            setResponses((prev) =>
              prev.map((r) => {
                if (r.userId === agent.id) {
                  return {
                    ...r,
                    status: "error" as const,
                    error: json.error ?? `Request failed with status ${response.status}`,
                  };
                }
                return r;
              })
            );
            return;
          }

          const reader = response.body?.getReader();
          if (!reader) {
            setResponses((prev) =>
              prev.map((r) => {
                if (r.userId === agent.id) {
                  return { ...r, status: "error" as const, error: "Failed to read stream" };
                }
                return r;
              })
            );
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
                  setResponses((prev) =>
                    prev.map((r) => {
                      if (r.userId === agent.id) {
                        return { ...r, content: r.content + event.content };
                      }
                      return r;
                    })
                  );
                } else if (event.type === "done") {
                  setResponses((prev) =>
                    prev.map((r) => {
                      if (r.userId === agent.id) {
                        return { ...r, status: "done" as const };
                      }
                      return r;
                    })
                  );
                } else if (event.type === "error") {
                  setResponses((prev) =>
                    prev.map((r) => {
                      if (r.userId === agent.id) {
                        return { ...r, status: "error" as const, error: event.message };
                      }
                      return r;
                    })
                  );
                }
              } catch {
                // skip malformed SSE lines
              }
            }
          }

          setResponses((prev) =>
            prev.map((r) => {
              if (r.userId === agent.id && r.status === "streaming") {
                return { ...r, status: "done" as const };
              }
              return r;
            })
          );
        } catch {
          setResponses((prev) =>
            prev.map((r) => {
              if (r.userId === agent.id) {
                return {
                  ...r,
                  status: "error" as const,
                  error: "Network error: unable to reach agent",
                };
              }
              return r;
            })
          );
        }
      });

      await Promise.allSettled(streamPromises);
      setDispatching(false);
    },
    [token, dispatching]
  );

  const clearResponses = useCallback(() => {
    setResponses([]);
  }, []);

  return {
    responses,
    dispatching,
    dispatchTask,
    clearResponses,
  };
}

export type { AgentResponse, ResponseStatus };
