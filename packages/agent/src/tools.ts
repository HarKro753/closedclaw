import { readFileSync, writeFileSync, readdirSync, statSync, existsSync, mkdirSync } from "node:fs";
import { join, resolve, relative } from "node:path";
import type Anthropic from "@anthropic-ai/sdk";

type Tool = Anthropic.Tool;

export function getToolDefinitions(): Tool[] {
  return [
    {
      name: "read_memory",
      description:
        "Read your persistent memory file. Use this to recall information saved from previous conversations.",
      input_schema: {
        type: "object" as const,
        properties: {},
        required: [],
      },
    },
    {
      name: "write_memory",
      description:
        "Write to your persistent memory file. Use 'append' mode to add new information, or 'overwrite' to replace all memory content. Prefer append for adding new facts.",
      input_schema: {
        type: "object" as const,
        properties: {
          content: {
            type: "string",
            description: "The content to write to memory",
          },
          mode: {
            type: "string",
            enum: ["append", "overwrite"],
            description:
              "Whether to append to existing memory or overwrite it entirely",
          },
        },
        required: ["content", "mode"],
      },
    },
    {
      name: "read_file",
      description:
        "Read a file from your personal workspace. Returns the file contents as text.",
      input_schema: {
        type: "object" as const,
        properties: {
          path: {
            type: "string",
            description: "Relative path to the file within your workspace",
          },
        },
        required: ["path"],
      },
    },
    {
      name: "write_file",
      description:
        "Write a file to your personal workspace. Creates the file if it does not exist, overwrites if it does.",
      input_schema: {
        type: "object" as const,
        properties: {
          path: {
            type: "string",
            description: "Relative path to the file within your workspace",
          },
          content: {
            type: "string",
            description: "The content to write to the file",
          },
        },
        required: ["path", "content"],
      },
    },
    {
      name: "list_files",
      description:
        "List files and directories in your personal workspace. Returns names with trailing / for directories.",
      input_schema: {
        type: "object" as const,
        properties: {
          path: {
            type: "string",
            description:
              "Relative path within the workspace to list. Defaults to root of workspace.",
          },
        },
        required: [],
      },
    },
    {
      name: "web_search",
      description:
        "Search the web for information. Only available when the BRAVE_API_KEY environment variable is configured.",
      input_schema: {
        type: "object" as const,
        properties: {
          query: {
            type: "string",
            description: "The search query",
          },
        },
        required: ["query"],
      },
    },
  ];
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
}

export async function executeTool(
  toolName: string,
  input: ToolInput,
  workspaceDir: string,
  memoryFile: string
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
  memoryFile: string
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
    .map(
      (r: BraveSearchResult) => `**${r.title}**\n${r.url}\n${r.description}`
    )
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
