import { Router } from "express";
import type { Database } from "bun:sqlite";
import { runAgent, runAgentStream } from "../agent/index.js";
import type { Message } from "../agent/index.js";
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

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders();

      let fullResponse = "";

      const stream = runAgentStream({
        userId: req.user.userId,
        message,
        history,
        workspaceDir: paths.workspaceDir,
        memoryFile: paths.memoryFile,
      });

      for await (const chunk of stream) {
        fullResponse += chunk;
        res.write(`data: ${JSON.stringify({ type: "chunk", content: chunk })}\n\n`);
      }

      db.prepare(
        "INSERT INTO messages (user_id, role, content) VALUES (?, 'assistant', ?)"
      ).run(req.user.userId, fullResponse);

      res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
      res.end();
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

  return router;
}
