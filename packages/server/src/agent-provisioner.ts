import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { Database } from "bun:sqlite";
import { v4 as uuid } from "uuid";
import {
  DEFAULT_SOUL_MD,
  DEFAULT_AGENT_MD,
  DEFAULT_MEMORY_MD,
  buildDefaultUserMd,
} from "./agent/index.js";

function getDataDir(): string {
  return process.env["DATA_DIR"] ?? "data";
}

interface ProvisionAgentOptions {
  userName: string;
  userEmail: string;
}

export function provisionAgent(
  db: Database,
  userId: string,
  options: ProvisionAgentOptions
): void {
  const agentId = uuid();
  const dataDir = getDataDir();
  const agentDir = join(dataDir, "agents", userId);
  const workspaceDir = join(agentDir, "workspace");
  const memoryFile = join(agentDir, "memory.md");
  const skillsDir = join(agentDir, "skills");
  const dailyMemoryDir = join(agentDir, "memory");

  if (!existsSync(agentDir)) {
    mkdirSync(agentDir, { recursive: true });
  }
  if (!existsSync(workspaceDir)) {
    mkdirSync(workspaceDir, { recursive: true });
  }
  if (!existsSync(skillsDir)) {
    mkdirSync(skillsDir, { recursive: true });
  }
  if (!existsSync(dailyMemoryDir)) {
    mkdirSync(dailyMemoryDir, { recursive: true });
  }

  writeFileSync(join(agentDir, "SOUL.md"), DEFAULT_SOUL_MD, "utf-8");
  writeFileSync(
    join(agentDir, "USER.md"),
    buildDefaultUserMd(options.userName, options.userEmail),
    "utf-8"
  );
  writeFileSync(join(agentDir, "AGENT.md"), DEFAULT_AGENT_MD, "utf-8");
  writeFileSync(join(agentDir, "MEMORY.md"), DEFAULT_MEMORY_MD, "utf-8");

  if (!existsSync(memoryFile)) {
    writeFileSync(memoryFile, "", "utf-8");
  }

  db.prepare(
    `INSERT INTO agents (id, user_id, workspace_dir, memory_file) VALUES (?, ?, ?, ?)`
  ).run(agentId, userId, workspaceDir, memoryFile);
}

export function getAgentPaths(
  db: Database,
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
