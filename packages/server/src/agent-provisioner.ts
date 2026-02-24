import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { Database } from "bun:sqlite";
import { v4 as uuid } from "uuid";

const DEFAULTS_DIR = join(dirname(fileURLToPath(import.meta.url)), "agent", "defaults");

function readDefaultFile(name: string): string {
  return readFileSync(join(DEFAULTS_DIR, name), "utf-8");
}

function buildDefaultUserMd(name: string, email: string): string {
  const template = readDefaultFile("USER.md");
  return template
    .replace("{{NAME}}", name)
    .replace("{{EMAIL}}", email)
    .replace("{{DATE}}", new Date().toISOString().slice(0, 10));
}

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

  writeFileSync(join(agentDir, "SOUL.md"), readDefaultFile("SOUL.md"), "utf-8");
  writeFileSync(
    join(agentDir, "USER.md"),
    buildDefaultUserMd(options.userName, options.userEmail),
    "utf-8"
  );
  writeFileSync(join(agentDir, "AGENT.md"), readDefaultFile("AGENT.md"), "utf-8");
  writeFileSync(join(agentDir, "MEMORY.md"), readDefaultFile("MEMORY.md"), "utf-8");

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
