import { Router } from "express";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { Database } from "bun:sqlite";
import { v4 as uuid } from "uuid";
import { authMiddleware } from "../middleware/auth.js";
import { adminMiddleware } from "../middleware/admin.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { getAgentPaths } from "../agent-provisioner.js";
import { getGatewayClient } from "../lib/openclaw-client.js";

interface UserWithStats {
  id: string;
  email: string;
  name: string;
  is_admin: number;
  created_at: string;
  active: number;
  message_count: number;
  agent_status: string | null;
}

interface AdminTaskRow {
  id: string;
  admin_id: string;
  target_user_id: string;
  message: string;
  response: string | null;
  status: string;
  created_at: string;
}

function getSessionKeyForUser(db: Database, userId: string): string {
  const row = db
    .prepare("SELECT openclaw_session_key FROM agents WHERE user_id = ?")
    .get(userId) as { openclaw_session_key?: string } | undefined;

  return row?.openclaw_session_key ?? `closedclaw:user:${userId}`;
}

export function createAdminRouter(db: Database): Router {
  const router = Router();

  router.use(authMiddleware);
  router.use(adminMiddleware(db));

  router.get("/users", (_req, res) => {
    const users = db
      .prepare(
        `SELECT 
          u.id, u.email, u.name, u.is_admin, u.created_at, u.active,
          COALESCE(m.message_count, 0) as message_count,
          a.status as agent_status
        FROM users u
        LEFT JOIN (
          SELECT user_id, COUNT(*) as message_count 
          FROM messages 
          GROUP BY user_id
        ) m ON m.user_id = u.id
        LEFT JOIN agents a ON a.user_id = u.id
        ORDER BY u.created_at DESC`
      )
      .all() as UserWithStats[];

    res.json({
      users: users.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        isAdmin: u.is_admin === 1,
        createdAt: u.created_at,
        active: u.active === 1,
        messageCount: u.message_count,
        agentStatus: u.agent_status ?? "none",
      })),
    });
  });

  router.delete("/users/:id", (req, res) => {
    const { id } = req.params;

    const user = db
      .prepare("SELECT id FROM users WHERE id = ?")
      .get(id) as { id: string } | undefined;

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    db.prepare("UPDATE users SET active = 0 WHERE id = ?").run(id);
    db.prepare("UPDATE agents SET status = 'deactivated' WHERE user_id = ?").run(id);

    res.json({ success: true });
  });

  router.get("/stats", (_req, res) => {
    const totalUsers = db
      .prepare("SELECT COUNT(*) as count FROM users")
      .get() as { count: number };

    const activeAgents = db
      .prepare("SELECT COUNT(*) as count FROM agents WHERE status = 'active'")
      .get() as { count: number };

    const totalMessages = db
      .prepare("SELECT COUNT(*) as count FROM messages")
      .get() as { count: number };

    const dataDir = process.env["DATA_DIR"] ?? "data";
    const globalSkillsDir = join(dataDir, "skills");
    let skillsDeployed = 0;
    if (existsSync(globalSkillsDir)) {
      skillsDeployed = readdirSync(globalSkillsDir).filter((f) =>
        f.endsWith(".md")
      ).length;
    }

    res.json({
      totalUsers: totalUsers.count,
      activeAgents: activeAgents.count,
      totalMessages: totalMessages.count,
      skillsDeployed,
    });
  });

  router.get("/activity", (_req, res) => {
    const recentMessages = db
      .prepare(
        `SELECT m.id, m.user_id, m.role, m.content, m.created_at, u.name, u.email
         FROM messages m
         JOIN users u ON u.id = m.user_id
         ORDER BY m.created_at DESC
         LIMIT 20`
      )
      .all() as Array<{
      id: number;
      user_id: string;
      role: string;
      content: string;
      created_at: string;
      name: string;
      email: string;
    }>;

    res.json({
      activity: recentMessages.map((m) => ({
        id: m.id,
        userId: m.user_id,
        role: m.role,
        content: m.content.length > 200 ? m.content.slice(0, 200) + "..." : m.content,
        createdAt: m.created_at,
        userName: m.name,
        userEmail: m.email,
      })),
    });
  });

  router.get("/agents/:userId/skills", (req, res) => {
    const { userId } = req.params;

    const paths = getAgentPaths(db, userId);
    if (!paths) {
      res.status(404).json({ error: "Agent not found" });
      return;
    }

    const agentDir = join(paths.workspaceDir, "..");
    const skillsDir = join(agentDir, "skills");

    if (!existsSync(skillsDir)) {
      res.json({ skills: [] });
      return;
    }

    const skillFiles = readdirSync(skillsDir).filter((f) => f.endsWith(".md"));
    const skills = skillFiles.map((file) => ({
      name: file.replace(/\.md$/, ""),
      content: readFileSync(join(skillsDir, file), "utf-8"),
    }));

    res.json({ skills });
  });

  router.get("/agents/:userId/memory", (req, res) => {
    const { userId } = req.params;

    const paths = getAgentPaths(db, userId);
    if (!paths) {
      res.status(404).json({ error: "Agent not found" });
      return;
    }

    const agentDir = join(paths.workspaceDir, "..");
    const memoryPath = join(agentDir, "MEMORY.md");

    if (!existsSync(memoryPath)) {
      res.json({ memory: "" });
      return;
    }

    const fullContent = readFileSync(memoryPath, "utf-8");
    const summary = fullContent.length > 500 ? fullContent.slice(0, 500) + "..." : fullContent;

    res.json({ memory: summary });
  });

  router.post("/agents/:userId/message", async (req: AuthenticatedRequest, res) => {
    const userId = req.params["userId"] as string;
    const { message } = req.body as { message?: string };

    if (!message?.trim()) {
      res.status(400).json({ error: "Message is required" });
      return;
    }

    const adminId = req.user?.userId ?? "unknown";
    const taskId = uuid();

    db.prepare(
      "INSERT INTO admin_tasks (id, admin_id, target_user_id, message, status) VALUES (?, ?, ?, ?, 'running')"
    ).run(taskId, adminId, userId, message.trim());

    try {
      const gateway = getGatewayClient();
      const sessionKey = getSessionKeyForUser(db, userId);

      const historyBefore = await gateway.getChatHistory(sessionKey, 100);
      const assistantCountBefore = historyBefore.filter(m => m.role === "assistant").length;

      await gateway.sendMessage(sessionKey, message.trim());

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
          "UPDATE admin_tasks SET response = ?, status = 'completed' WHERE id = ?"
        ).run(response, taskId);

        res.json({ response, userId, taskId });
      } else {
        db.prepare(
          "UPDATE admin_tasks SET status = 'error', response = ? WHERE id = ?"
        ).run("Agent response timeout", taskId);

        res.status(504).json({ error: "Agent response timeout" });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gateway error";

      db.prepare(
        "UPDATE admin_tasks SET response = ?, status = 'error' WHERE id = ?"
      ).run(msg, taskId);

      res.status(502).json({ error: "Gateway unavailable. Make sure OpenClaw is running." });
    }
  });

  router.post("/agents/:userId/message/stream", async (req: AuthenticatedRequest, res) => {
    const userId = req.params["userId"] as string;
    const { message } = req.body as { message?: string };

    if (!message?.trim()) {
      res.status(400).json({ error: "Message is required" });
      return;
    }

    const adminId = req.user?.userId ?? "unknown";
    const taskId = uuid();

    db.prepare(
      "INSERT INTO admin_tasks (id, admin_id, target_user_id, message, status) VALUES (?, ?, ?, ?, 'running')"
    ).run(taskId, adminId, userId, message.trim());

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    try {
      const gateway = getGatewayClient();
      await gateway.connect();

      const sessionKey = getSessionKeyForUser(db, userId);

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

          db.prepare(
            "UPDATE admin_tasks SET response = ?, status = 'completed' WHERE id = ?"
          ).run(fullResponse, taskId);

          res.write(`data: ${JSON.stringify({ type: "done", taskId })}\n\n`);
          res.end();
        }
      });

      await gateway.sendMessage(sessionKey, message.trim());

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
          }

          db.prepare(
            "UPDATE admin_tasks SET response = ?, status = 'completed' WHERE id = ?"
          ).run(fullResponse || "No response received", taskId);

          res.write(`data: ${JSON.stringify({ type: "done", taskId })}\n\n`);
          res.end();
        }
      }, 60000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gateway error";

      db.prepare(
        "UPDATE admin_tasks SET response = ?, status = 'error' WHERE id = ?"
      ).run(msg, taskId);

      res.write(`data: ${JSON.stringify({ type: "error", message: "Gateway unavailable" })}\n\n`);
      res.end();
    }
  });

  router.get("/tasks", (_req, res) => {
    const tasks = db
      .prepare(
        `SELECT t.*, u.name as target_name, u.email as target_email
         FROM admin_tasks t
         JOIN users u ON u.id = t.target_user_id
         ORDER BY t.created_at DESC
         LIMIT 50`
      )
      .all() as Array<AdminTaskRow & { target_name: string; target_email: string }>;

    res.json({
      tasks: tasks.map((t) => ({
        id: t.id,
        adminId: t.admin_id,
        targetUserId: t.target_user_id,
        targetName: t.target_name,
        targetEmail: t.target_email,
        message: t.message,
        response: t.response,
        status: t.status,
        createdAt: t.created_at,
      })),
    });
  });

  return router;
}
