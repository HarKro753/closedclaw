import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";

const DEFAULTS_DIR = join(dirname(fileURLToPath(import.meta.url)), "defaults");

function readDefault(fileName: string): string {
  return readFileSync(join(DEFAULTS_DIR, fileName), "utf-8");
}

export const DEFAULT_SOUL_MD = readDefault("SOUL.md");
export const DEFAULT_AGENT_MD = readDefault("AGENT.md");
export const DEFAULT_MEMORY_MD = readDefault("MEMORY.md");

const USER_TEMPLATE = readDefault("USER.md");

export function buildDefaultUserMd(name: string, email: string): string {
  const date = new Date().toISOString().split("T")[0] ?? "unknown";
  return USER_TEMPLATE.replace("{{NAME}}", name)
    .replace("{{EMAIL}}", email)
    .replace("{{DATE}}", date);
}
