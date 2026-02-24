import {
  readFileSync,
  writeFileSync,
  readdirSync,
  statSync,
  existsSync,
  mkdirSync,
  unlinkSync,
} from "node:fs";
import { execSync } from "node:child_process";
import { join, resolve, relative, dirname } from "node:path";
import { z } from "zod";
import { tool, createSdkMcpServer } from "@anthropic-ai/claude-agent-sdk";

const SERVER_NAME = "closedclaw";

function getDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getTodayDateString(): string {
  return getDateString(new Date());
}

function getAgentDir(workspaceDir: string): string {
  return join(workspaceDir, "..");
}

function validatePath(workspaceDir: string, requestedPath: string): string {
  const absoluteWorkspace = resolve(workspaceDir);
  const absoluteRequested = resolve(absoluteWorkspace, requestedPath);
  const rel = relative(absoluteWorkspace, absoluteRequested);

  if (rel.startsWith("..") || resolve(absoluteRequested) === resolve("/")) {
    throw new Error("Path traversal detected: access denied");
  }

  return absoluteRequested;
}

interface ToolInput {
  content?: string;
  mode?: "append" | "overwrite";
  path?: string;
  query?: string;
  oldText?: string;
  newText?: string;
  command?: string;
  url?: string;
  maxChars?: number;
  maxResults?: number;
  name?: string;
}

export async function executeTool(
  toolName: string,
  input: ToolInput,
  workspaceDir: string,
  memoryFile: string,
): Promise<string> {
  try {
    return await executeToolInner(toolName, input, workspaceDir, memoryFile);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return `Error: ${message}`;
  }
}

async function executeToolInner(
  toolName: string,
  input: ToolInput,
  workspaceDir: string,
  memoryFile: string,
): Promise<string> {
  switch (toolName) {
    case "read_memory": {
      if (!existsSync(memoryFile)) {
        return "(memory is empty)";
      }
      const content = readFileSync(memoryFile, "utf-8");
      if (content.trim().length === 0) {
        return "(memory is empty)";
      }
      return content;
    }

    case "write_memory": {
      const { content, mode } = input;
      if (!content) {
        return "Error: content is required";
      }
      if (mode === "append") {
        const existing = existsSync(memoryFile)
          ? readFileSync(memoryFile, "utf-8")
          : "";
        writeFileSync(memoryFile, existing + "\n" + content, "utf-8");
      } else {
        writeFileSync(memoryFile, content, "utf-8");
      }
      return "Memory updated successfully";
    }

    case "read_file": {
      const { path } = input;
      if (!path) {
        return "Error: path is required";
      }
      const filePath = validatePath(workspaceDir, path);
      if (!existsSync(filePath)) {
        return `Error: file not found: ${path}`;
      }
      return readFileSync(filePath, "utf-8");
    }

    case "write_file": {
      const { path, content } = input;
      if (!path || content === undefined) {
        return "Error: path and content are required";
      }
      const filePath = validatePath(workspaceDir, path);
      const dir = filePath.substring(0, filePath.lastIndexOf("/"));
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
      writeFileSync(filePath, content, "utf-8");
      return `File written successfully: ${path}`;
    }

    case "list_files": {
      const targetPath = input.path ?? ".";
      const dirPath = validatePath(workspaceDir, targetPath);
      if (!existsSync(dirPath)) {
        return `Error: directory not found: ${targetPath}`;
      }
      const entries = readdirSync(dirPath);
      const result = entries.map((entry) => {
        const fullPath = join(dirPath, entry);
        const isDir = statSync(fullPath).isDirectory();
        return isDir ? `${entry}/` : entry;
      });
      if (result.length === 0) {
        return "(empty directory)";
      }
      return result.join("\n");
    }

    case "web_search": {
      const { query } = input;
      if (!query) {
        return "Error: query is required";
      }
      const braveApiKey = process.env["BRAVE_API_KEY"];
      if (!braveApiKey) {
        return "Web search is not available: BRAVE_API_KEY is not configured";
      }
      return await braveSearch(query, braveApiKey);
    }

    case "edit_file": {
      const { path, oldText, newText } = input;
      if (!path || oldText === undefined || newText === undefined) {
        return "Error: path, oldText, and newText are required";
      }
      const filePath = validatePath(workspaceDir, path);
      if (!existsSync(filePath)) {
        return `Error: file not found: ${path}`;
      }
      const fileContent = readFileSync(filePath, "utf-8");
      const occurrences = fileContent.split(oldText).length - 1;
      if (occurrences === 0) {
        return `Error: oldText not found in ${path}`;
      }
      if (occurrences > 1) {
        return `Error: oldText found ${occurrences} times in ${path}, expected exactly 1 match`;
      }
      const updatedContent = fileContent.replace(oldText, newText);
      writeFileSync(filePath, updatedContent, "utf-8");
      return `File edited successfully: ${path}`;
    }

    case "bash": {
      const { command } = input;
      if (!command) {
        return "Error: command is required";
      }
      const sensitiveKeys = [
        "ANTHROPIC_API_KEY",
        "JWT_SECRET",
        "BRAVE_API_KEY",
        "API_KEY",
        "SECRET",
        "TOKEN",
        "PASSWORD",
      ];
      const cleanEnv: Record<string, string> = {};
      for (const [key, value] of Object.entries(process.env)) {
        const upperKey = key.toUpperCase();
        const isSensitive = sensitiveKeys.some((s) => upperKey.includes(s));
        if (!isSensitive && value !== undefined) {
          cleanEnv[key] = value;
        }
      }
      try {
        const output = execSync(command, {
          cwd: workspaceDir,
          timeout: 30_000,
          maxBuffer: 1024 * 1024,
          env: cleanEnv,
          encoding: "utf-8",
          stdio: ["pipe", "pipe", "pipe"],
        });
        return output || "(no output)";
      } catch (err) {
        if (err && typeof err === "object" && "stdout" in err && "stderr" in err) {
          const execErr = err as { stdout: string; stderr: string };
          return `${execErr.stdout ?? ""}${execErr.stderr ?? ""}`.trim() || "Command failed with no output";
        }
        const message = err instanceof Error ? err.message : String(err);
        return `Error: ${message}`;
      }
    }

    case "web_fetch": {
      const { url, maxChars } = input;
      if (!url) {
        return "Error: url is required";
      }
      const charLimit = maxChars ?? 10000;
      try {
        const response = await fetch(url);
        if (!response.ok) {
          return `Fetch error: ${response.status} ${response.statusText}`;
        }
        const text = await response.text();
        const stripped = text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
        if (stripped.length > charLimit) {
          return stripped.substring(0, charLimit) + "\n...(truncated)";
        }
        return stripped;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return `Fetch error: ${message}`;
      }
    }

    case "delete_file": {
      const { path } = input;
      if (!path) {
        return "Error: path is required";
      }
      const filePath = validatePath(workspaceDir, path);
      if (!existsSync(filePath)) {
        return `Error: file not found: ${path}`;
      }
      unlinkSync(filePath);
      return `File deleted successfully: ${path}`;
    }

    case "memory_daily_write": {
      const { content } = input;
      if (!content) {
        return "Error: content is required";
      }
      const agentDir = getAgentDir(workspaceDir);
      const memoryDir = join(agentDir, "memory");
      if (!existsSync(memoryDir)) {
        mkdirSync(memoryDir, { recursive: true });
      }
      const dailyFile = join(memoryDir, `${getTodayDateString()}.md`);
      const existing = existsSync(dailyFile) ? readFileSync(dailyFile, "utf-8") : "";
      const separator = existing.length > 0 ? "\n" : "";
      writeFileSync(dailyFile, existing + separator + content, "utf-8");
      return `Daily note updated for ${getTodayDateString()}`;
    }

    case "memory_daily_read": {
      const agentDir = getAgentDir(workspaceDir);
      const dailyFile = join(agentDir, "memory", `${getTodayDateString()}.md`);
      if (!existsSync(dailyFile)) {
        return "(no daily notes for today)";
      }
      const content = readFileSync(dailyFile, "utf-8");
      if (content.trim().length === 0) {
        return "(no daily notes for today)";
      }
      return content;
    }

    case "memory_search": {
      const { query, maxResults } = input;
      if (!query) {
        return "Error: query is required";
      }
      const limit = maxResults ?? 20;
      const queryWords = query.toLowerCase().split(/\s+/).filter(Boolean);
      const agentDir = getAgentDir(workspaceDir);
      const results: string[] = [];

      const memoryMdPath = join(agentDir, "MEMORY.md");
      if (existsSync(memoryMdPath)) {
        const lines = readFileSync(memoryMdPath, "utf-8").split("\n");
        for (let i = 0; i < lines.length && results.length < limit; i++) {
          const lower = lines[i]!.toLowerCase();
          if (queryWords.some((w) => lower.includes(w))) {
            results.push(`MEMORY.md:${i + 1}: ${lines[i]}`);
          }
        }
      }

      const memoryDir = join(agentDir, "memory");
      if (existsSync(memoryDir)) {
        const files = readdirSync(memoryDir).filter((f) => f.endsWith(".md"));
        for (const file of files) {
          if (results.length >= limit) break;
          const filePath = join(memoryDir, file);
          const lines = readFileSync(filePath, "utf-8").split("\n");
          for (let i = 0; i < lines.length && results.length < limit; i++) {
            const lower = lines[i]!.toLowerCase();
            if (queryWords.some((w) => lower.includes(w))) {
              results.push(`memory/${file}:${i + 1}: ${lines[i]}`);
            }
          }
        }
      }

      if (results.length === 0) {
        return "No matching memory entries found";
      }
      return results.join("\n");
    }

    case "list_skills": {
      const skillsDir = join(workspaceDir, "skills");
      if (!existsSync(skillsDir)) {
        return "No skills directory found";
      }
      const entries = readdirSync(skillsDir);
      const skills: string[] = [];
      for (const entry of entries) {
        const skillMdPath = join(skillsDir, entry, "SKILL.md");
        if (existsSync(skillMdPath)) {
          const content = readFileSync(skillMdPath, "utf-8");
          const firstLine = content.split("\n").find((line) => line.trim().length > 0) ?? "(no description)";
          skills.push(`${entry}: ${firstLine}`);
        }
      }
      if (skills.length === 0) {
        return "No skills found";
      }
      return skills.join("\n");
    }

    case "read_skill": {
      const { name } = input;
      if (!name) {
        return "Error: name is required";
      }
      if (name.includes("..") || name.includes("/") || name.includes("\\")) {
        return "Error: invalid skill name — path traversal not allowed";
      }
      const skillPath = join(workspaceDir, "skills", name, "SKILL.md");
      if (!existsSync(skillPath)) {
        return `Error: skill not found: ${name}`;
      }
      return readFileSync(skillPath, "utf-8");
    }

    default:
      return `Error: unknown tool: ${toolName}`;
  }
}

async function braveSearch(query: string, apiKey: string): Promise<string> {
  const url = new URL("https://api.search.brave.com/res/v1/web/search");
  url.searchParams.set("q", query);
  url.searchParams.set("count", "5");

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      "Accept-Encoding": "gzip",
      "X-Subscription-Token": apiKey,
    },
  });

  if (!response.ok) {
    return `Search error: ${response.status} ${response.statusText}`;
  }

  const data = (await response.json()) as BraveSearchResponse;
  const results = data.web?.results ?? [];

  if (results.length === 0) {
    return "No search results found";
  }

  return results
    .map((r: BraveSearchResult) => `**${r.title}**\n${r.url}\n${r.description}`)
    .join("\n\n");
}

interface BraveSearchResult {
  title: string;
  url: string;
  description: string;
}

interface BraveSearchResponse {
  web?: {
    results: BraveSearchResult[];
  };
}

function buildSdkTools(workspaceDir: string, memoryFile: string) {
  return [
    tool(
      "read_memory",
      "Read your persistent memory file. Use this to recall information saved from previous conversations.",
      {},
      async () => {
        const result = await executeTool(
          "read_memory",
          {},
          workspaceDir,
          memoryFile,
        );
        return { content: [{ type: "text" as const, text: result }] };
      },
    ),
    tool(
      "write_memory",
      "Write to your persistent memory file. Use 'append' mode to add new information, or 'overwrite' to replace all memory content. Prefer append for adding new facts.",
      {
        content: z.string().describe("The content to write to memory"),
        mode: z
          .enum(["append", "overwrite"])
          .describe(
            "Whether to append to existing memory or overwrite it entirely",
          ),
      },
      async (args: { content: string; mode: "append" | "overwrite" }) => {
        const result = await executeTool(
          "write_memory",
          args,
          workspaceDir,
          memoryFile,
        );
        return { content: [{ type: "text" as const, text: result }] };
      },
    ),
    tool(
      "read_file",
      "Read a file from your personal workspace. Returns the file contents as text.",
      {
        path: z
          .string()
          .describe("Relative path to the file within your workspace"),
      },
      async (args: { path: string }) => {
        const result = await executeTool(
          "read_file",
          args,
          workspaceDir,
          memoryFile,
        );
        return { content: [{ type: "text" as const, text: result }] };
      },
    ),
    tool(
      "write_file",
      "Write a file to your personal workspace. Creates the file if it does not exist, overwrites if it does.",
      {
        path: z
          .string()
          .describe("Relative path to the file within your workspace"),
        content: z.string().describe("The content to write to the file"),
      },
      async (args: { path: string; content: string }) => {
        const result = await executeTool(
          "write_file",
          args,
          workspaceDir,
          memoryFile,
        );
        return { content: [{ type: "text" as const, text: result }] };
      },
    ),
    tool(
      "list_files",
      "List files and directories in your personal workspace. Returns names with trailing / for directories.",
      {
        path: z
          .string()
          .optional()
          .describe(
            "Relative path within the workspace to list. Defaults to root of workspace.",
          ),
      },
      async (args: { path?: string }) => {
        const result = await executeTool(
          "list_files",
          args,
          workspaceDir,
          memoryFile,
        );
        return { content: [{ type: "text" as const, text: result }] };
      },
    ),
    tool(
      "web_search",
      "Search the web for information. Only available when the BRAVE_API_KEY environment variable is configured.",
      {
        query: z.string().describe("The search query"),
      },
      async (args: { query: string }) => {
        const result = await executeTool(
          "web_search",
          args,
          workspaceDir,
          memoryFile,
        );
        return { content: [{ type: "text" as const, text: result }] };
      },
    ),
    tool(
      "edit_file",
      "Find exact oldText in a file and replace with newText. Error if 0 or multiple matches found.",
      {
        path: z.string().describe("Relative path to the file within your workspace"),
        oldText: z.string().describe("Exact text to find in the file"),
        newText: z.string().describe("Text to replace the oldText with"),
      },
      async (args: { path: string; oldText: string; newText: string }) => {
        const result = await executeTool("edit_file", args, workspaceDir, memoryFile);
        return { content: [{ type: "text" as const, text: result }] };
      },
    ),
    tool(
      "bash",
      "Execute a shell command in the workspace directory. Timeout 30s. Sensitive env vars are stripped.",
      {
        command: z.string().describe("The shell command to execute"),
      },
      async (args: { command: string }) => {
        const result = await executeTool("bash", args, workspaceDir, memoryFile);
        return { content: [{ type: "text" as const, text: result }] };
      },
    ),
    tool(
      "web_fetch",
      "Fetch a URL and return its text content with HTML tags stripped. Truncates to maxChars (default 10000).",
      {
        url: z.string().describe("The URL to fetch"),
        maxChars: z.number().optional().describe("Maximum characters to return (default 10000)"),
      },
      async (args: { url: string; maxChars?: number }) => {
        const result = await executeTool("web_fetch", args, workspaceDir, memoryFile);
        return { content: [{ type: "text" as const, text: result }] };
      },
    ),
    tool(
      "delete_file",
      "Delete a file from your personal workspace.",
      {
        path: z.string().describe("Relative path to the file within your workspace"),
      },
      async (args: { path: string }) => {
        const result = await executeTool("delete_file", args, workspaceDir, memoryFile);
        return { content: [{ type: "text" as const, text: result }] };
      },
    ),
    tool(
      "memory_daily_write",
      "Append a note to today's daily memory file. Creates the file if it doesn't exist.",
      {
        content: z.string().describe("The content to append to today's daily note"),
      },
      async (args: { content: string }) => {
        const result = await executeTool("memory_daily_write", args, workspaceDir, memoryFile);
        return { content: [{ type: "text" as const, text: result }] };
      },
    ),
    tool(
      "memory_daily_read",
      "Read today's daily memory notes.",
      {},
      async () => {
        const result = await executeTool("memory_daily_read", {}, workspaceDir, memoryFile);
        return { content: [{ type: "text" as const, text: result }] };
      },
    ),
    tool(
      "memory_search",
      "Search through MEMORY.md and all daily memory files. Returns matching lines with file:line context.",
      {
        query: z.string().describe("Search query — lines containing any of these words (case-insensitive) will match"),
        maxResults: z.number().optional().describe("Maximum number of results to return (default 20)"),
      },
      async (args: { query: string; maxResults?: number }) => {
        const result = await executeTool("memory_search", args, workspaceDir, memoryFile);
        return { content: [{ type: "text" as const, text: result }] };
      },
    ),
    tool(
      "list_skills",
      "List available skills in your workspace. Returns skill names with descriptions from their SKILL.md files.",
      {},
      async () => {
        const result = await executeTool("list_skills", {}, workspaceDir, memoryFile);
        return { content: [{ type: "text" as const, text: result }] };
      },
    ),
    tool(
      "read_skill",
      "Read the full SKILL.md content for a named skill.",
      {
        name: z.string().describe("The skill name (directory name under skills/)"),
      },
      async (args: { name: string }) => {
        const result = await executeTool("read_skill", args, workspaceDir, memoryFile);
        return { content: [{ type: "text" as const, text: result }] };
      },
    ),
  ];
}

export function createToolServer(workspaceDir: string, memoryFile: string) {
  const sdkTools = buildSdkTools(workspaceDir, memoryFile);
  return createSdkMcpServer({
    name: SERVER_NAME,
    version: "1.0.0",
    tools: sdkTools,
  });
}

export function getAllowedToolNames(): string[] {
  const toolNames = [
    "read_memory",
    "write_memory",
    "read_file",
    "write_file",
    "list_files",
    "web_search",
    "edit_file",
    "bash",
    "web_fetch",
    "delete_file",
    "memory_daily_write",
    "memory_daily_read",
    "memory_search",
    "list_skills",
    "read_skill",
  ];
  return toolNames.map((name) => `mcp__${SERVER_NAME}__${name}`);
}
