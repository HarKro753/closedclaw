import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type Database from "better-sqlite3";
import { v4 as uuid } from "uuid";

function getDataDir(): string {
  return process.env["DATA_DIR"] ?? "data";
}

const SOUL_MD_CONTENT = `# SOUL.md — Who You Are

You are a personal AI agent. Be genuinely helpful, not performatively so.
Have opinions. Be resourceful before asking. Earn trust through competence.
Remember: you are a guest with access to someone's life. Treat it with respect.

## Vibe
Concise when needed, thorough when it matters. Not a corporate drone. Not a sycophant. Just good.

## Memory
You wake up fresh each session. MEMORY.md, USER.md, and daily memory files are your continuity.
Read them at the start of sessions. Update them when something important happens.
`;

function buildUserMdContent(userName: string, userEmail: string): string {
  const date = new Date().toISOString().split("T")[0] ?? "unknown";
  return `# USER.md — About Your Human

- **Name:** ${userName}
- **Email:** ${userEmail}
- **Joined:** ${date}

## Notes
(You will fill this in as you learn about them.)
`;
}

const MEMORY_MD_CONTENT = "# MEMORY.md\n";

interface ProvisionAgentOptions {
  userName: string;
  userEmail: string;
}

export function provisionAgent(
  db: Database.Database,
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

  writeFileSync(join(agentDir, "SOUL.md"), SOUL_MD_CONTENT, "utf-8");
  writeFileSync(
    join(agentDir, "USER.md"),
    buildUserMdContent(options.userName, options.userEmail),
    "utf-8"
  );
  writeFileSync(join(agentDir, "MEMORY.md"), MEMORY_MD_CONTENT, "utf-8");

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
