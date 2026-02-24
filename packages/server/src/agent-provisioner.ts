import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type Database from "better-sqlite3";
import { v4 as uuid } from "uuid";

const DATA_DIR = process.env["DATA_DIR"] ?? "data";

export function provisionAgent(db: Database.Database, userId: string): void {
  const agentId = uuid();
  const agentDir = join(DATA_DIR, "agents", userId);
  const workspaceDir = join(agentDir, "workspace");
  const memoryFile = join(agentDir, "memory.md");

  if (!existsSync(agentDir)) {
    mkdirSync(agentDir, { recursive: true });
  }
  if (!existsSync(workspaceDir)) {
    mkdirSync(workspaceDir, { recursive: true });
  }
  if (!existsSync(memoryFile)) {
    writeFileSync(memoryFile, "", "utf-8");
  }

  db.prepare(
    `INSERT INTO agents (id, user_id, workspace_dir, memory_file) VALUES (?, ?, ?, ?)`
  ).run(agentId, userId, workspaceDir, memoryFile);
}

export function getAgentPaths(
  db: Database.Database,
  userId: string
): { workspaceDir: string; memoryFile: string } | null {
  const agent = db
    .prepare("SELECT workspace_dir, memory_file FROM agents WHERE user_id = ?")
    .get(userId) as
    | { workspace_dir: string; memory_file: string }
    | undefined;

  if (!agent) {
    return null;
  }

  return {
    workspaceDir: agent.workspace_dir,
    memoryFile: agent.memory_file,
  };
}
