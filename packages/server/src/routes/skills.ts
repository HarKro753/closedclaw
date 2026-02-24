import { Router } from "express";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  readdirSync,
  unlinkSync,
} from "node:fs";
import { join } from "node:path";
import type Database from "better-sqlite3";
import { authMiddleware } from "../middleware/auth.js";
import { adminMiddleware } from "../middleware/admin.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { getAgentPaths } from "../agent-provisioner.js";

function getDataDir(): string {
  return process.env["DATA_DIR"] ?? "data";
}

function getGlobalSkillsDir(): string {
  return join(getDataDir(), "skills");
}

function ensureDir(dir: string): void {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function listSkillFiles(dir: string): Array<{ name: string; content: string }> {
  if (!existsSync(dir)) {
    return [];
  }
  const entries = readdirSync(dir).filter((f) => f.endsWith(".md"));
  return entries.map((entry) => ({
    name: entry.replace(/\.md$/, ""),
    content: readFileSync(join(dir, entry), "utf-8"),
  }));
}

function sanitizeSkillName(name: string): string | null {
  const sanitized = name.replace(/[^a-zA-Z0-9_-]/g, "");
  if (sanitized.length === 0) {
    return null;
  }
  return sanitized;
}

export function createSkillsRouter(db: Database.Database): Router {
  const router = Router();

  router.use(authMiddleware);

  router.get("/", (_req, res) => {
    const skills = listSkillFiles(getGlobalSkillsDir());
    res.json({ skills });
  });

  router.post("/", adminMiddleware(db), (req: AuthenticatedRequest, res) => {
    const { name, content } = req.body as { name?: string; content?: string };

    if (!name || !content) {
      res.status(400).json({ error: "Name and content are required" });
      return;
    }

    const safeName = sanitizeSkillName(name);
    if (!safeName) {
      res.status(400).json({ error: "Invalid skill name" });
      return;
    }

    const dir = getGlobalSkillsDir();
    ensureDir(dir);
    writeFileSync(join(dir, `${safeName}.md`), content, "utf-8");
    res.status(201).json({ name: safeName, created: true });
  });

  router.delete(
    "/:name",
    adminMiddleware(db),
    (req: AuthenticatedRequest, res) => {
      const name = req.params["name"] as string | undefined;
      const safeName = sanitizeSkillName(name ?? "");
      if (!safeName) {
        res.status(400).json({ error: "Invalid skill name" });
        return;
      }

      const filePath = join(getGlobalSkillsDir(), `${safeName}.md`);
      if (!existsSync(filePath)) {
        res.status(404).json({ error: "Skill not found" });
        return;
      }

      unlinkSync(filePath);
      res.json({ name: safeName, deleted: true });
    }
  );

  router.get("/agent", (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const paths = getAgentPaths(db, req.user.userId);
    if (!paths) {
      res.status(404).json({ error: "Agent not found" });
      return;
    }

    const agentDir = join(paths.workspaceDir, "..");
    const skillsDir = join(agentDir, "skills");
    const skills = listSkillFiles(skillsDir);
    res.json({ skills });
  });

  router.post("/agent", (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const { name, content } = req.body as { name?: string; content?: string };
    if (!name || !content) {
      res.status(400).json({ error: "Name and content are required" });
      return;
    }

    const safeName = sanitizeSkillName(name);
    if (!safeName) {
      res.status(400).json({ error: "Invalid skill name" });
      return;
    }

    const paths = getAgentPaths(db, req.user.userId);
    if (!paths) {
      res.status(404).json({ error: "Agent not found" });
      return;
    }

    const agentDir = join(paths.workspaceDir, "..");
    const skillsDir = join(agentDir, "skills");
    ensureDir(skillsDir);
    writeFileSync(join(skillsDir, `${safeName}.md`), content, "utf-8");
    res.status(201).json({ name: safeName, created: true });
  });

  router.delete("/agent/:name", (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const name = req.params["name"] as string | undefined;
    const safeName = sanitizeSkillName(name ?? "");
    if (!safeName) {
      res.status(400).json({ error: "Invalid skill name" });
      return;
    }

    const paths = getAgentPaths(db, req.user.userId);
    if (!paths) {
      res.status(404).json({ error: "Agent not found" });
      return;
    }

    const agentDir = join(paths.workspaceDir, "..");
    const filePath = join(agentDir, "skills", `${safeName}.md`);
    if (!existsSync(filePath)) {
      res.status(404).json({ error: "Skill not found" });
      return;
    }

    unlinkSync(filePath);
    res.json({ name: safeName, deleted: true });
  });

  return router;
}
