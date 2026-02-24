import { existsSync, mkdirSync, writeFileSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import {
  DEFAULT_SOUL_MD,
  DEFAULT_AGENT_MD,
  DEFAULT_MEMORY_MD,
  buildDefaultUserMd,
} from "@closedclaw/agent";

const WORKSPACE_ROOT = join(homedir(), ".closedclaw-cli");

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
    { path: join(agentDir, "SOUL.md"), content: DEFAULT_SOUL_MD },
    { path: join(agentDir, "USER.md"), content: buildDefaultUserMd("CLI Developer", "dev@closedclaw.local") },
    { path: join(agentDir, "AGENT.md"), content: DEFAULT_AGENT_MD },
    { path: join(agentDir, "MEMORY.md"), content: DEFAULT_MEMORY_MD },
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
