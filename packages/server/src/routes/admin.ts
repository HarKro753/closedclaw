import { Router } from "express";
import type Database from "better-sqlite3";
import { authMiddleware } from "../middleware/auth.js";
import { adminMiddleware } from "../middleware/admin.js";

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

export function createAdminRouter(db: Database.Database): Router {
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

  return router;
}
