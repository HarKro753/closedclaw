import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { executeTool } from "./tools.js";
import { buildSystemPrompt } from "./system-prompt.js";
import { mkdirSync, rmSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const TEST_DIR = "/tmp/closedclaw-agent-test";
const WORKSPACE = join(TEST_DIR, "workspace");
const MEMORY_FILE = join(TEST_DIR, "memory.md");

describe("Agent Tools", () => {
  beforeEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true });
    }
    mkdirSync(WORKSPACE, { recursive: true });
    writeFileSync(MEMORY_FILE, "", "utf-8");
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true });
    }
  });

  describe("read_memory", () => {
    it("returns empty message when memory is empty", async () => {
      const result = await executeTool("read_memory", {}, WORKSPACE, MEMORY_FILE);
      expect(result).toBe("(memory is empty)");
    });

    it("returns memory content", async () => {
      writeFileSync(MEMORY_FILE, "User likes TypeScript", "utf-8");
      const result = await executeTool("read_memory", {}, WORKSPACE, MEMORY_FILE);
      expect(result).toBe("User likes TypeScript");
    });
  });

  describe("write_memory", () => {
    it("overwrites memory", async () => {
      await executeTool(
        "write_memory",
        { content: "First", mode: "overwrite" },
        WORKSPACE,
        MEMORY_FILE
      );
      expect(readFileSync(MEMORY_FILE, "utf-8")).toBe("First");
    });

    it("appends to memory", async () => {
      writeFileSync(MEMORY_FILE, "First", "utf-8");
      await executeTool(
        "write_memory",
        { content: "Second", mode: "append" },
        WORKSPACE,
        MEMORY_FILE
      );
      const content = readFileSync(MEMORY_FILE, "utf-8");
      expect(content).toContain("First");
      expect(content).toContain("Second");
    });
  });

  describe("write_file", () => {
    it("writes a file to workspace", async () => {
      const result = await executeTool(
        "write_file",
        { path: "test.txt", content: "hello world" },
        WORKSPACE,
        MEMORY_FILE
      );
      expect(result).toContain("successfully");
      expect(readFileSync(join(WORKSPACE, "test.txt"), "utf-8")).toBe("hello world");
    });

    it("creates subdirectories as needed", async () => {
      await executeTool(
        "write_file",
        { path: "sub/dir/file.txt", content: "nested" },
        WORKSPACE,
        MEMORY_FILE
      );
      expect(readFileSync(join(WORKSPACE, "sub/dir/file.txt"), "utf-8")).toBe("nested");
    });
  });

  describe("read_file", () => {
    it("reads a file from workspace", async () => {
      writeFileSync(join(WORKSPACE, "read-me.txt"), "contents here", "utf-8");
      const result = await executeTool(
        "read_file",
        { path: "read-me.txt" },
        WORKSPACE,
        MEMORY_FILE
      );
      expect(result).toBe("contents here");
    });

    it("returns error for missing file", async () => {
      const result = await executeTool(
        "read_file",
        { path: "missing.txt" },
        WORKSPACE,
        MEMORY_FILE
      );
      expect(result).toContain("not found");
    });
  });

  describe("list_files", () => {
    it("lists files in workspace", async () => {
      writeFileSync(join(WORKSPACE, "a.txt"), "a", "utf-8");
      writeFileSync(join(WORKSPACE, "b.txt"), "b", "utf-8");
      mkdirSync(join(WORKSPACE, "subdir"));

      const result = await executeTool(
        "list_files",
        {},
        WORKSPACE,
        MEMORY_FILE
      );

      expect(result).toContain("a.txt");
      expect(result).toContain("b.txt");
      expect(result).toContain("subdir/");
    });

    it("returns empty for empty directory", async () => {
      const result = await executeTool(
        "list_files",
        {},
        WORKSPACE,
        MEMORY_FILE
      );
      expect(result).toBe("(empty directory)");
    });
  });

  describe("path traversal prevention", () => {
    it("rejects path traversal attempts", async () => {
      const result = await executeTool(
        "read_file",
        { path: "../../etc/passwd" },
        WORKSPACE,
        MEMORY_FILE
      );
      expect(result).toContain("traversal");
    });
  });

  describe("web_search", () => {
    it("returns unavailable when no API key", async () => {
      delete process.env["BRAVE_API_KEY"];
      const result = await executeTool(
        "web_search",
        { query: "test" },
        WORKSPACE,
        MEMORY_FILE
      );
      expect(result).toContain("not available");
    });
  });

  describe("unknown tool", () => {
    it("returns error for unknown tool", async () => {
      const result = await executeTool(
        "nonexistent_tool",
        {},
        WORKSPACE,
        MEMORY_FILE
      );
      expect(result).toContain("unknown tool");
    });
  });
});

describe("System Prompt", () => {
  it("includes user name", () => {
    const prompt = buildSystemPrompt("Alice");
    expect(prompt).toContain("Alice");
  });

  it("mentions ClosedClaw", () => {
    const prompt = buildSystemPrompt("Bob");
    expect(prompt).toContain("ClosedClaw");
  });
});

describe("runAgent (mocked)", () => {
  it("can be imported", async () => {
    const { runAgent } = await import("./index.js");
    expect(typeof runAgent).toBe("function");
  });
});
