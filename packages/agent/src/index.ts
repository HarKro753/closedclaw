import { query } from "@anthropic-ai/claude-agent-sdk";
import type { SDKMessage } from "@anthropic-ai/claude-agent-sdk";
import { createToolServer, getAllowedToolNames } from "./tools.js";
import { buildSystemPrompt } from "./system-prompt.js";

export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface RunAgentOptions {
  userId: string;
  message: string;
  history: Message[];
  workspaceDir: string;
  memoryFile: string;
}

const MAX_TURNS = 15;

export async function runAgent(opts: RunAgentOptions): Promise<string> {
  const { message, history, workspaceDir, memoryFile } = opts;

  const systemPrompt = buildSystemPrompt(workspaceDir);
  const mcpServer = createToolServer(workspaceDir, memoryFile);
  const allowedTools = getAllowedToolNames();

  const prompt = formatPrompt(history, message);

  const stream = query({
    prompt,
    options: {
      systemPrompt,
      model: "sonnet",
      maxTurns: MAX_TURNS,
      mcpServers: { closedclaw: mcpServer },
      allowedTools,
      tools: [],
      persistSession: false,
      permissionMode: "bypassPermissions",
      allowDangerouslySkipPermissions: true,
    },
  });

  return await collectResponse(stream);
}

function formatPrompt(history: Message[], currentMessage: string): string {
  if (history.length === 0) {
    return currentMessage;
  }

  const historyText = history
    .map((msg) => `[${msg.role}]: ${msg.content}`)
    .join("\n\n");

  return `Previous conversation:\n${historyText}\n\n[user]: ${currentMessage}`;
}

async function collectResponse(
  stream: AsyncIterable<SDKMessage>,
): Promise<string> {
  const textParts: string[] = [];

  for await (const message of stream) {
    if (message.type === "assistant") {
      for (const block of message.message.content) {
        if (block.type === "text") {
          textParts.push(block.text);
        }
      }
    }

    if (message.type === "result") {
      if (message.subtype !== "success") {
        const errorDetail =
          "error" in message && typeof message.error === "string"
            ? message.error
            : "Agent execution failed";
        throw new Error(errorDetail);
      }
    }
  }

  if (textParts.length === 0) {
    return "";
  }

  return textParts[textParts.length - 1] ?? "";
}

export { executeTool, createToolServer, getAllowedToolNames } from "./tools.js";
export { buildSystemPrompt } from "./system-prompt.js";
export {
  DEFAULT_SOUL_MD,
  DEFAULT_AGENT_MD,
  DEFAULT_MEMORY_MD,
  buildDefaultUserMd,
} from "./defaults.js";
