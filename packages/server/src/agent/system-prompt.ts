import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";

function readFileIfExists(filePath: string): string | null {
  if (!existsSync(filePath)) {
    return null;
  }
  const content = readFileSync(filePath, "utf-8").trim();
  if (content.length === 0 || content === "# MEMORY.md") {
    return null;
  }
  return content;
}

function getDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getTodayDateString(): string {
  return getDateString(new Date());
}

function getYesterdayDateString(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return getDateString(yesterday);
}

export function buildSystemPrompt(workspaceDir: string): string {
  const agentDir = dirname(workspaceDir);

  const sections: string[] = [];

  sections.push(
    "You are a personal AI agent, part of ClosedClaw — an organizational agent OS.",
  );
  sections.push("");

  const soulContent = readFileIfExists(join(agentDir, "SOUL.md"));
  if (soulContent) {
    sections.push("## Your Identity and Values");
    sections.push(soulContent);
    sections.push("");
  }

  const userContent = readFileIfExists(join(agentDir, "USER.md"));
  if (userContent) {
    sections.push("## Your Human");
    sections.push(userContent);
    sections.push("");
  }

  const agentContent = readFileIfExists(join(agentDir, "AGENT.md"));
  if (agentContent) {
    sections.push("## Behavioral Rules");
    sections.push(agentContent);
    sections.push("");
  }

  const memoryContent = readFileIfExists(join(agentDir, "MEMORY.md"));
  if (memoryContent) {
    sections.push("## Your Long-Term Memory");
    sections.push(memoryContent);
    sections.push("");
  }

  const yesterdayFile = join(agentDir, "memory", `${getYesterdayDateString()}.md`);
  const yesterdayContent = readFileIfExists(yesterdayFile);
  if (yesterdayContent) {
    sections.push("## Yesterday's Notes");
    sections.push(yesterdayContent);
    sections.push("");
  }

  const todayFile = join(agentDir, "memory", `${getTodayDateString()}.md`);
  const todayContent = readFileIfExists(todayFile);
  if (todayContent) {
    sections.push("## Today's Notes");
    sections.push(todayContent);
    sections.push("");
  }

  sections.push(
    "Be helpful, concise, and proactive. When you learn something important about the user or their preferences, save it to memory.",
  );

  return sections.join("\n");
}
