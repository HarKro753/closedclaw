import { readFileSync, existsSync, readdirSync } from "node:fs";
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

function readSkillFiles(skillsDir: string): string[] {
  if (!existsSync(skillsDir)) {
    return [];
  }
  const entries = readdirSync(skillsDir).filter((f) => f.endsWith(".md"));
  const skills: string[] = [];
  for (const entry of entries) {
    const content = readFileIfExists(join(skillsDir, entry));
    if (content) {
      skills.push(content);
    }
  }
  return skills;
}

function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function buildSystemPrompt(workspaceDir: string): string {
  const agentDir = dirname(workspaceDir);

  const sections: string[] = [];

  sections.push(
    "You are a personal AI agent, part of ClosedClaw — an organizational agent OS."
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

  const memoryContent = readFileIfExists(join(agentDir, "MEMORY.md"));
  if (memoryContent) {
    sections.push("## Your Long-Term Memory");
    sections.push(memoryContent);
    sections.push("");
  }

  const todayFile = join(agentDir, "memory", `${getTodayDateString()}.md`);
  const todayContent = readFileIfExists(todayFile);
  if (todayContent) {
    sections.push("## Today's Notes");
    sections.push(todayContent);
    sections.push("");
  }

  const agentSkills = readSkillFiles(join(agentDir, "skills"));
  const globalSkillsDir = join(agentDir, "..", "..", "skills");
  const globalSkills = readSkillFiles(globalSkillsDir);
  const allSkills = [...globalSkills, ...agentSkills];

  if (allSkills.length > 0) {
    sections.push("## Skills & Context");
    for (const skill of allSkills) {
      sections.push(skill);
      sections.push("");
    }
  }

  sections.push("## Available Capabilities");
  sections.push(
    "- Read and write to your persistent memory file to remember things across conversations"
  );
  sections.push(
    "- Read, write, and list files in your personal workspace"
  );
  sections.push("- Search the web for information (when available)");
  sections.push("");
  sections.push(
    "Be helpful, concise, and proactive. When you learn something important about the user or their preferences, save it to memory."
  );

  return sections.join("\n");
}
