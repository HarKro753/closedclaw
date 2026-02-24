import { Router } from "express";
import type { Database } from "bun:sqlite";
import { runAgent } from "@closedclaw/agent";
import type { Message } from "@closedclaw/agent";
import { authMiddleware } from "../middleware/auth.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { getAgentPaths } from "../agent-provisioner.js";

interface MessageRow {
  id: number;
  role: "user" | "assistant";
  content: string;
  created_at: string;
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

      const paths = getAgentPaths(db, req.user.userId);
      if (!paths) {
        res.status(404).json({ error: "Agent not found for this user" });
        return;
      }

      const historyRows = db
        .prepare(
          "SELECT role, content FROM messages WHERE user_id = ? ORDER BY created_at ASC"
        )
        .all(req.user.userId) as MessageRow[];

      const history: Message[] = historyRows.map((row) => ({
        role: row.role,
        content: row.content,
      }));

      db.prepare(
        "INSERT INTO messages (user_id, role, content) VALUES (?, 'user', ?)"
      ).run(req.user.userId, message);

      const response = await runAgent({
        userId: req.user.userId,
        message,
        history,
        workspaceDir: paths.workspaceDir,
        memoryFile: paths.memoryFile,
      });

      db.prepare(
        "INSERT INTO messages (user_id, role, content) VALUES (?, 'assistant', ?)"
      ).run(req.user.userId, response);

      res.json({ response });
    } catch (err) {
      console.error("Agent message error:", err);
      res.status(500).json({ error: "Failed to process message" });
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

  return router;
}
