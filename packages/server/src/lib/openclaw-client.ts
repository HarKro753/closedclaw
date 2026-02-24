import { randomUUID } from "node:crypto";

export interface OpenClawAgent {
  id: string;
  name?: string;
  status?: string;
  sessionKey?: string;
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: string;
}

type EventCallback = (data: unknown) => void;

interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
  timeout: ReturnType<typeof setTimeout>;
}

export class OpenClawClient {
  private ws: WebSocket | null = null;
  private readonly url: string;
  private readonly authToken: string | undefined;
  private pendingRequests = new Map<string, PendingRequest>();
  private eventListeners = new Map<string, Set<EventCallback>>();
  private authenticated = false;
  private connectPromise: Promise<void> | null = null;

  constructor(url = "ws://127.0.0.1:18789", opts?: { authToken?: string }) {
    this.url = url;
    this.authToken = opts?.authToken;
  }

  async connect(): Promise<void> {
    if (this.authenticated) return;
    if (this.connectPromise) return this.connectPromise;

    this.connectPromise = new Promise<void>((resolve, reject) => {
      const ws = new WebSocket(this.url);
      this.ws = ws;

      const timeout = setTimeout(() => {
        reject(new Error("Gateway connection timeout"));
        ws.close();
      }, 10000);

      ws.addEventListener("message", (event: MessageEvent) => {
        try {
          const msg = JSON.parse(event.data as string) as Record<string, unknown>;
          this.handleMessage(msg, timeout, resolve, reject);
        } catch { /* ignore non-JSON */ }
      });

      ws.addEventListener("close", () => {
        this.authenticated = false;
        this.connectPromise = null;
        clearTimeout(timeout);
      });

      ws.addEventListener("error", () => {
        clearTimeout(timeout);
        if (!this.authenticated) reject(new Error("Gateway WebSocket error"));
      });
    });

    return this.connectPromise;
  }

  private handleMessage(
    msg: Record<string, unknown>,
    connectTimeout: ReturnType<typeof setTimeout>,
    resolve: () => void,
    reject: (err: Error) => void,
  ): void {
    if (msg["type"] === "event") {
      const evt = msg as { type: string; event: string; seq?: number; payload?: unknown };

      if (evt.event === "connect.challenge") {
        const nonce = (evt.payload as Record<string, unknown> | undefined)?.["nonce"];
        const id = randomUUID();
        this.pendingRequests.set(id, {
          resolve: () => {
            clearTimeout(connectTimeout);
            this.authenticated = true;
            resolve();
          },
          reject: (err: unknown) => {
            clearTimeout(connectTimeout);
            reject(err instanceof Error ? err : new Error(String(err)));
          },
          timeout: setTimeout(() => {
            this.pendingRequests.delete(id);
            reject(new Error("Connect handshake timeout"));
          }, 10000),
        });

        this.ws?.send(JSON.stringify({
          type: "req",
          id,
          method: "connect",
          params: {
            minProtocol: 3,
            maxProtocol: 3,
            nonce,
            client: { id: "closedclaw", displayName: "ClosedClaw", version: "1.0.0", platform: "node", mode: "backend" },
            caps: [],
            auth: this.authToken ? { token: this.authToken } : undefined,
            role: "operator",
            scopes: ["operator.admin"],
          },
        }));
        return;
      }

      const listeners = this.eventListeners.get(evt.event);
      if (listeners) {
        for (const cb of listeners) {
          try { cb(evt.payload ?? evt); } catch { /* ignore */ }
        }
      }
      const wildcardListeners = this.eventListeners.get("*");
      if (wildcardListeners) {
        for (const cb of wildcardListeners) {
          try { cb({ event: evt.event, payload: evt.payload }); } catch { /* ignore */ }
        }
      }
      return;
    }

    if (msg["type"] === "res") {
      const res = msg as { type: string; id: string; ok: boolean; payload?: unknown; error?: { message?: string } };
      const pending = this.pendingRequests.get(res.id);
      if (!pending) return;

      if (res.ok && (res.payload as Record<string, unknown> | undefined)?.["status"] === "accepted") return;

      this.pendingRequests.delete(res.id);
      clearTimeout(pending.timeout);

      if (res.ok) {
        pending.resolve(res.payload);
      } else {
        pending.reject(new Error(res.error?.message ?? "Unknown gateway error"));
      }
    }
  }

  async call<T>(method: string, params?: unknown, timeoutMs = 30000): Promise<T> {
    await this.connect();
    const id = randomUUID();

    return new Promise<T>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`RPC timeout: ${method}`));
      }, timeoutMs);

      this.pendingRequests.set(id, {
        resolve: (v) => resolve(v as T),
        reject,
        timeout,
      });
      this.ws!.send(JSON.stringify({ type: "req", id, method, params: params ?? {} }));
    });
  }

  onEvent(type: string, callback: EventCallback): () => void {
    if (!this.eventListeners.has(type)) this.eventListeners.set(type, new Set());
    this.eventListeners.get(type)!.add(callback);
    return () => { this.eventListeners.get(type)?.delete(callback); };
  }

  async listAgents(): Promise<OpenClawAgent[]> {
    const result = await this.call<{ agents?: OpenClawAgent[] }>("agents.list", {});
    return result?.agents ?? [];
  }

  async createAgent(params: { name: string; workspace?: string }): Promise<{ agentId?: string; id?: string }> {
    return this.call("agents.create", params);
  }

  async getAgentFile(agentId: string, name: string): Promise<string> {
    const result = await this.call<{ file?: { content?: string } }>("agents.files.get", { agentId, name });
    return result?.file?.content ?? "";
  }

  async setAgentFile(agentId: string, name: string, content: string): Promise<void> {
    await this.call("agents.files.set", { agentId, name, content });
  }

  async sendMessage(sessionKey: string, message: string): Promise<void> {
    await this.call("chat.send", { sessionKey, message, idempotencyKey: randomUUID() }, 5000);
  }

  async getChatHistory(sessionKey: string, limit = 50): Promise<ChatMessage[]> {
    const result = await this.call<{ messages?: ChatMessage[] }>("chat.history", { sessionKey, limit });
    return result?.messages ?? [];
  }

  async health(): Promise<unknown> {
    return this.call("health", {});
  }

  isConnected(): boolean {
    return this.authenticated && this.ws?.readyState === WebSocket.OPEN;
  }

  disconnect(): void {
    this.ws?.close();
    this.ws = null;
    this.authenticated = false;
    this.connectPromise = null;
  }
}

let instance: OpenClawClient | null = null;

export function getGatewayClient(): OpenClawClient {
  if (!instance) {
    instance = new OpenClawClient(
      process.env["OPENCLAW_GATEWAY_URL"] ?? "ws://127.0.0.1:18789",
      { authToken: process.env["OPENCLAW_AUTH_TOKEN"] },
    );
  }
  return instance;
}
