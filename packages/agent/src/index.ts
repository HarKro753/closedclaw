import Anthropic from "@anthropic-ai/sdk";
import { getToolDefinitions, executeTool } from "./tools.js";
import { buildSystemPrompt } from "./system-prompt.js";

export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface RunAgentOptions {
  userId: string;
  userName: string;
  message: string;
  history: Message[];
  workspaceDir: string;
  memoryFile: string;
}

const MAX_ITERATIONS = 15;

export async function runAgent(opts: RunAgentOptions): Promise<string> {
  const { userName, message, history, workspaceDir, memoryFile } = opts;

  const model = process.env["CLAUDE_MODEL"] ?? "claude-sonnet-4-5";
  const client = new Anthropic();

  const systemPrompt = buildSystemPrompt(userName);
  const tools = getToolDefinitions();

  const messages: Anthropic.MessageParam[] = [
    ...history.map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    })),
    { role: "user", content: message },
  ];

  let iterations = 0;

  while (iterations < MAX_ITERATIONS) {
    iterations++;

    const response = await client.messages.create({
      model,
      max_tokens: 4096,
      system: systemPrompt,
      tools,
      messages,
    });

    if (response.stop_reason === "end_turn" || !hasToolUse(response)) {
      const textContent = response.content.find(
        (block) => block.type === "text"
      );
      return textContent ? textContent.text : "";
    }

    const assistantContent = response.content;
    messages.push({ role: "assistant", content: assistantContent });

    const toolResults: Anthropic.ToolResultBlockParam[] = [];

    for (const block of assistantContent) {
      if (block.type === "tool_use") {
        const result = await executeTool(
          block.name,
          block.input as Record<string, string>,
          workspaceDir,
          memoryFile
        );
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: result,
        });
      }
    }

    messages.push({ role: "user", content: toolResults });
  }

  return "I've reached my processing limit for this request. Please try a simpler question or break your request into smaller steps.";
}

function hasToolUse(response: Anthropic.Message): boolean {
  return response.content.some((block) => block.type === "tool_use");
}

export { getToolDefinitions, executeTool } from "./tools.js";
export { buildSystemPrompt } from "./system-prompt.js";
