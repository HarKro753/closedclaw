import { existsSync, mkdirSync, writeFileSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const WORKSPACE_ROOT = join(homedir(), ".closedclaw-cli");

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

const USER_MD_CONTENT = `# USER.md — About Your Human

- **Name:** CLI Developer
- **Email:** dev@closedclaw.local
- **Joined:** ${new Date().toISOString().split("T")[0] ?? "unknown"}

## Notes
(You will fill this in as you learn about them.)
`;

const MEMORY_MD_CONTENT = "# MEMORY.md\n";

export function getWorkspacePaths() {
  const agentDir = WORKSPACE_ROOT;
  const workspaceDir = join(agentDir, "workspace");
  const memoryFile = join(agentDir, "memory.md");
  const skillsDir = join(agentDir, "skills");
  const dailyMemoryDir = join(agentDir, "memory");

  return { agentDir, workspaceDir, memoryFile, skillsDir, dailyMemoryDir };
}

export function ensureWorkspace(): void {
  const { agentDir, workspaceDir, memoryFile, skillsDir, dailyMemoryDir } =
    getWorkspacePaths();

  const dirsToCreate = [agentDir, workspaceDir, skillsDir, dailyMemoryDir];
  for (const dir of dirsToCreate) {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }

  const filesToSeed: Array<{ path: string; content: string }> = [
    { path: join(agentDir, "SOUL.md"), content: SOUL_MD_CONTENT },
    { path: join(agentDir, "USER.md"), content: USER_MD_CONTENT },
    { path: join(agentDir, "MEMORY.md"), content: MEMORY_MD_CONTENT },
  ];

  for (const file of filesToSeed) {
    if (!existsSync(file.path)) {
      writeFileSync(file.path, file.content, "utf-8");
    }
  }

  if (!existsSync(memoryFile)) {
    writeFileSync(memoryFile, "", "utf-8");
  }
}

export function readMemoryFile(): string {
  const { agentDir } = getWorkspacePaths();
  const memoryPath = join(agentDir, "MEMORY.md");
  if (!existsSync(memoryPath)) {
    return "(empty)";
  }
  const content = readFileSync(memoryPath, "utf-8").trim();
  if (content === "# MEMORY.md" || content.length === 0) {
    return "(empty)";
  }
  return content;
}

export function readSoulFile(): string {
  const { agentDir } = getWorkspacePaths();
  const soulPath = join(agentDir, "SOUL.md");
  if (!existsSync(soulPath)) {
    return "(not configured)";
  }
  return readFileSync(soulPath, "utf-8");
}

export function listSkills(): string[] {
  const { skillsDir } = getWorkspacePaths();
  if (!existsSync(skillsDir)) {
    return [];
  }
  return readdirSync(skillsDir).filter((f) => f.endsWith(".md"));
}

export function getWorkspaceRoot(): string {
  return WORKSPACE_ROOT;
}
