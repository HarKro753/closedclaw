import { createInterface } from "node:readline";
import { runAgent } from "@closedclaw/agent";
import type { Message } from "@closedclaw/agent";
import {
  ensureWorkspace,
  getWorkspacePaths,
  getWorkspaceRoot,
  readMemoryFile,
  readSoulFile,
  listSkills,
} from "./workspace.js";

function printHeader(): void {
  const root = getWorkspaceRoot();
  const workspaceLine = `  Workspace: ${root}`;
  const titleLine = "  ClosedClaw CLI — Dev Mode";
  const width = Math.max(workspaceLine.length, titleLine.length) + 2;
  console.log("");
  console.log(`╭${"─".repeat(width)}╮`);
  console.log(`│${titleLine.padEnd(width)}│`);
  console.log(`│${workspaceLine.padEnd(width)}│`);
  console.log(`╰${"─".repeat(width)}╯`);
  console.log("");
  console.log("Type your message. Slash commands:");
  console.log("  /memory — show current MEMORY.md");
  console.log("  /soul   — show SOUL.md");
  console.log("  /skills — list available skills");
  console.log("  /clear  — clear session history");
  console.log("  /quit   — exit");
  console.log("");
}

function handleSlashCommand(
  input: string,
  history: Message[]
): { handled: boolean; shouldQuit: boolean; newHistory: Message[] } {
  const command = input.trim().toLowerCase();

  if (command === "/quit" || command === "/exit") {
    console.log("Goodbye.");
    return { handled: true, shouldQuit: true, newHistory: history };
  }

  if (command === "/memory") {
    console.log("\n--- MEMORY.md ---");
    console.log(readMemoryFile());
    console.log("--- end ---\n");
    return { handled: true, shouldQuit: false, newHistory: history };
  }

  if (command === "/soul") {
    console.log("\n--- SOUL.md ---");
    console.log(readSoulFile());
    console.log("--- end ---\n");
    return { handled: true, shouldQuit: false, newHistory: history };
  }

  if (command === "/skills") {
    const skills = listSkills();
    if (skills.length === 0) {
      console.log("\n(no skills installed)\n");
    } else {
      console.log("\nInstalled skills:");
      for (const skill of skills) {
        console.log(`  - ${skill}`);
      }
      console.log("");
    }
    return { handled: true, shouldQuit: false, newHistory: history };
  }

  if (command === "/clear") {
    console.log("Session history cleared.\n");
    return { handled: true, shouldQuit: false, newHistory: [] };
  }

  return { handled: false, shouldQuit: false, newHistory: history };
}

async function sendMessage(
  message: string,
  history: Message[]
): Promise<{ response: string; updatedHistory: Message[] }> {
  const { workspaceDir, memoryFile } = getWorkspacePaths();

  const response = await runAgent({
    userId: "cli-user",
    message,
    history,
    workspaceDir,
    memoryFile,
  });

  const updatedHistory: Message[] = [
    ...history,
    { role: "user", content: message },
    { role: "assistant", content: response },
  ];

  return { response, updatedHistory };
}

async function main(): Promise<void> {
  ensureWorkspace();
  printHeader();

  let history: Message[] = [];

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  });

  const prompt = (): void => {
    rl.question("You: ", async (input) => {
      const trimmed = input.trim();

      if (trimmed.length === 0) {
        prompt();
        return;
      }

      if (trimmed.startsWith("/")) {
        const result = handleSlashCommand(trimmed, history);
        history = result.newHistory;
        if (result.shouldQuit) {
          rl.close();
          return;
        }
        if (result.handled) {
          prompt();
          return;
        }
      }

      process.stdout.write("\nThinking...\n");

      try {
        const result = await sendMessage(trimmed, history);
        history = result.updatedHistory;
        console.log(`\nAgent: ${result.response}\n`);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`\nError: ${message}\n`);
      }

      prompt();
    });
  };

  prompt();

  rl.on("close", () => {
    process.exit(0);
  });
}

main().catch((err) => {
  console.error("CLI startup failed:", err);
  process.exit(1);
});
