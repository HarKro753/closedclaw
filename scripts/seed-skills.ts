import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const DATA_DIR = process.env["DATA_DIR"] ?? "data";
const SKILLS_DIR = join(DATA_DIR, "skills");

const SKILL_SOURCES: Array<{ name: string; remotePath: string }> = [
  { name: "agent-loop", remotePath: "skills/agent-loop/SKILL.md" },
  { name: "memory-management", remotePath: "skills/memory-management/SKILL.md" },
  { name: "subagents", remotePath: "skills/subagents/SKILL.md" },
];

const BASE_URL =
  "https://raw.githubusercontent.com/HarKro753/MyPrompts/main";

async function fetchSkill(remotePath: string): Promise<string> {
  const url = `${BASE_URL}/${remotePath}`;
  console.log(`  Fetching: ${url}`);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch ${url}: ${response.status} ${response.statusText}`
    );
  }
  return await response.text();
}

async function seedSkills(): Promise<void> {
  console.log("Seeding global skills...");
  console.log(`  Target directory: ${SKILLS_DIR}`);

  if (!existsSync(SKILLS_DIR)) {
    mkdirSync(SKILLS_DIR, { recursive: true });
  }

  let successCount = 0;
  let failCount = 0;

  for (const skill of SKILL_SOURCES) {
    try {
      const content = await fetchSkill(skill.remotePath);
      const outputPath = join(SKILLS_DIR, `${skill.name}.md`);
      writeFileSync(outputPath, content, "utf-8");
      console.log(`  Saved: ${skill.name}.md (${content.length} bytes)`);
      successCount++;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`  Failed to seed ${skill.name}: ${message}`);
      failCount++;
    }
  }

  console.log(
    `\nDone: ${successCount} skills seeded, ${failCount} failed.`
  );

  if (failCount > 0) {
    process.exit(1);
  }
}

seedSkills().catch((err) => {
  console.error("Seed script failed:", err);
  process.exit(1);
});
