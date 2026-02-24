import { Router } from "express";
import type { Database } from "bun:sqlite";
import { getClientForUser, evictClient } from "../lib/gateway-pool.js";
import { provisionGatewayAgent } from "../lib/provision.js";
import { authMiddleware } from "../middleware/auth.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import type { OpenClawClient } from "../lib/openclaw-client.js";

interface MessageRow {
  id: number;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

function getSessionKey(db: Database, userId: string): string {
  const row = db
    .prepare("SELECT openclaw_session_key FROM agents WHERE user_id = ?")
    .get(userId) as { openclaw_session_key?: string } | undefined;

  return row?.openclaw_session_key ?? `closedclaw:user:${userId}`;
}

function getUserGatewayClient(db: Database, userId: string): OpenClawClient {
  const agent = db
    .prepare("SELECT gateway_url, gateway_token FROM agents WHERE user_id = ?")
    .get(userId) as { gateway_url: string | null; gateway_token: string | null } | undefined;

  const url = agent?.gateway_url ?? process.env["OPENCLAW_GATEWAY_URL"] ?? "ws://127.0.0.1:18789";
  const token = agent?.gateway_token ?? process.env["OPENCLAW_AUTH_TOKEN"];

  return getClientForUser(userId, { url, token });
}

export function createAgentRouter(db: Database): Router {
  const router = Router();

  router.use(authMiddleware);

  router.post("/message", async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Authentication required" });
        return;
      }

      const { message } = req.body as { message?: string };
      if (!message || message.trim().length === 0) {
        res.status(400).json({ error: "Message is required" });
        return;
      }

      const sessionKey = getSessionKey(db, req.user.userId);

      db.prepare(
        "INSERT INTO messages (user_id, role, content) VALUES (?, 'user', ?)"
      ).run(req.user.userId, message);

      try {
        const gateway = getUserGatewayClient(db, req.user.userId);

        const historyBefore = await gateway.getChatHistory(sessionKey, 100);
        const assistantCountBefore = historyBefore.filter(m => m.role === "assistant").length;

        await gateway.sendMessage(sessionKey, message);

        let response = "";
        for (let i = 0; i < 30; i++) {
          await new Promise(r => setTimeout(r, 2000));
          const history = await gateway.getChatHistory(sessionKey, 100);
          const assistantMessages = history.filter(m => m.role === "assistant");
          if (assistantMessages.length > assistantCountBefore) {
            response = assistantMessages[assistantMessages.length - 1]?.content ?? "";
            break;
          }
        }

        if (response) {
          db.prepare(
            "INSERT INTO messages (user_id, role, content) VALUES (?, 'assistant', ?)"
          ).run(req.user.userId, response);
          res.json({ response });
        } else {
          res.status(504).json({ error: "Agent response timeout" });
        }
      } catch (err) {
        console.error("Gateway error:", err);
        res.status(502).json({ error: "Gateway unavailable. Make sure OpenClaw is running." });
      }
    } catch (err) {
      console.error("Agent message error:", err);
      res.status(500).json({ error: "Failed to process message" });
    }
  });

  router.post("/message/stream", async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Authentication required" });
        return;
      }

      const { message } = req.body as { message?: string };
      if (!message || message.trim().length === 0) {
        res.status(400).json({ error: "Message is required" });
        return;
      }

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders();

      const sessionKey = getSessionKey(db, req.user.userId);

      try {
        const gateway = getUserGatewayClient(db, req.user.userId);
        await gateway.connect();

        db.prepare(
          "INSERT INTO messages (user_id, role, content) VALUES (?, 'user', ?)"
        ).run(req.user.userId, message);

        let fullResponse = "";
        let resolved = false;

        const unsub = gateway.onEvent("message.part", (data) => {
          const part = data as { sessionKey?: string; text?: string };
          if (part.sessionKey !== sessionKey) return;
          if (part.text) {
            fullResponse += part.text;
            res.write(`data: ${JSON.stringify({ type: "chunk", content: part.text })}\n\n`);
          }
        });

        const unsubDone = gateway.onEvent("message.completed", (data) => {
          const evt = data as { sessionKey?: string };
          if (evt.sessionKey !== sessionKey) return;
          if (!resolved) {
            resolved = true;
            unsub();
            unsubDone();
            if (fullResponse) {
              db.prepare(
                "INSERT INTO messages (user_id, role, content) VALUES (?, 'assistant', ?)"
              ).run(req.user!.userId, fullResponse);
            }
            res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
            res.end();
          }
        });

        await gateway.sendMessage(sessionKey, message);

        setTimeout(async () => {
          if (!resolved) {
            resolved = true;
            unsub();
            unsubDone();
            const history = await gateway.getChatHistory(sessionKey, 10).catch(() => []);
            const lastAssistant = history.filter(m => m.role === "assistant").pop();
            if (lastAssistant?.content && !fullResponse) {
              fullResponse = lastAssistant.content;
              res.write(`data: ${JSON.stringify({ type: "chunk", content: fullResponse })}\n\n`);
              db.prepare(
                "INSERT INTO messages (user_id, role, content) VALUES (?, 'assistant', ?)"
              ).run(req.user!.userId, fullResponse);
            }
            res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
            res.end();
          }
        }, 60000);
      } catch {
        res.write(`data: ${JSON.stringify({ type: "error", message: "Gateway unavailable" })}\n\n`);
        res.end();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Agent execution failed";
      console.error("Agent stream error:", err);
      res.write(`data: ${JSON.stringify({ type: "error", message: errorMessage })}\n\n`);
      res.end();
    }
  });

  router.get("/history", (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const messages = db
      .prepare(
        "SELECT id, role, content, created_at FROM messages WHERE user_id = ? ORDER BY created_at ASC"
      )
      .all(req.user.userId) as MessageRow[];

    res.json({
      messages: messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        createdAt: m.created_at,
      })),
    });
  });

  router.delete("/history", (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    db.prepare("DELETE FROM messages WHERE user_id = ?").run(req.user.userId);
    res.json({ success: true });
  });

  router.get("/gateway-status", async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const agent = db
      .prepare("SELECT gateway_url, gateway_token, status FROM agents WHERE user_id = ?")
      .get(req.user.userId) as { gateway_url: string | null; gateway_token: string | null; status: string } | undefined;

    if (!agent?.gateway_url) {
      const fallbackUrl = process.env["OPENCLAW_GATEWAY_URL"];
      if (!fallbackUrl) {
        res.json({ configured: false, connected: false, status: "pending", message: "No gateway configured. Add your OpenClaw gateway URL in settings." });
        return;
      }

      try {
        const client = getUserGatewayClient(db, req.user.userId);
        await client.health();
        res.json({ configured: false, connected: true, status: "connected" });
      } catch {
        res.json({ configured: false, connected: false, status: "error" });
      }
      return;
    }

    try {
      const client = getUserGatewayClient(db, req.user.userId);
      await client.health();
      db.prepare("UPDATE agents SET status = 'connected', last_connected_at = datetime('now') WHERE user_id = ?")
        .run(req.user.userId);
      res.json({ configured: true, connected: true, status: "connected", url: agent.gateway_url });
    } catch {
      db.prepare("UPDATE agents SET status = 'error' WHERE user_id = ?").run(req.user.userId);
      res.json({ configured: true, connected: false, status: "error", url: agent.gateway_url });
    }
  });

  router.patch("/gateway", async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { gateway_url, gateway_token } = req.body as { gateway_url: string; gateway_token?: string };

    if (!gateway_url) {
      res.status(400).json({ error: "gateway_url required" });
      return;
    }

    evictClient(req.user.userId);
    db.prepare("UPDATE agents SET gateway_url = ?, gateway_token = ?, status = 'pending' WHERE user_id = ?")
      .run(gateway_url, gateway_token ?? null, req.user.userId);

    const user = db.prepare("SELECT name FROM users WHERE id = ?").get(req.user.userId) as { name: string } | undefined;
    if (user) {
      provisionGatewayAgent(req.user.userId, gateway_url, gateway_token, user.name, db).catch(console.error);
    }

    res.json({ success: true });
  });

  router.post("/gateway/test", async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { gateway_url, gateway_token } = req.body as { gateway_url: string; gateway_token?: string };

    if (!gateway_url) {
      res.status(400).json({ error: "gateway_url required" });
      return;
    }

    try {
      const testClient = getClientForUser(`test:${req.user.userId}`, { url: gateway_url, token: gateway_token });
      await testClient.health();
      evictClient(`test:${req.user.userId}`);
      res.json({ success: true, message: "Connection successful" });
    } catch {
      evictClient(`test:${req.user.userId}`);
      res.json({ success: false, message: "Connection failed. Check the URL and token." });
    }
  });

  return router;
}
