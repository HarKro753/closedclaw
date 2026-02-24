---
name: agent-tools
description: How to design and implement tools for agentic systems - the interface between AI reasoning and real-world actions. Use when creating new tools, designing tool interfaces, or troubleshooting tool execution.
---

# Agent Tools

Tools are functions the LLM can call to interact with the world. Without tools, an LLM can only generate text. With tools, it becomes an agent that can read files, execute commands, search the web, and take real actions.

## Quick start

Minimal tool definition:

```python
def read_file(path: str) -> str:
    """Read the contents of a file at the given path."""
    with open(path, 'r') as f:
        return f.read()

# Register with schema
tool = {
    "name": "read_file",
    "description": "Read the contents of a file at the given path",
    "parameters": {
        "type": "object",
        "properties": {
            "path": {"type": "string", "description": "The file path to read"}
        },
        "required": ["path"]
    }
}
```

## Instructions

### Step 1: Define the tool interface

Every tool needs four things:

1. **Name** - Unique identifier (snake_case, short, descriptive)
2. **Description** - What it does and when to use it
3. **Parameters** - JSON Schema defining arguments
4. **Execute** - Function that performs the action

### Step 2: Write the parameter schema

```json
{
  "type": "object",
  "properties": {
    "path": {
      "type": "string",
      "description": "The file path to read"
    },
    "limit": {
      "type": "integer",
      "description": "Maximum lines to return (optional)"
    }
  },
  "required": ["path"]
}
```

### Step 3: Implement the execute function

```python
def execute(args: dict) -> ToolResult:
    try:
        path = args["path"]
        limit = args.get("limit", None)

        content = read_file(path, limit)
        return ToolResult(for_llm=content)

    except FileNotFoundError:
        return ToolResult(for_llm=f"File not found: {path}", is_error=True)
    except Exception as e:
        return ToolResult(for_llm=f"Error: {str(e)}", is_error=True)
```

### Step 4: Register the tool

```python
registry.register(Tool(
    name="read_file",
    description="Read the contents of a file at the given path",
    parameters=schema,
    execute=execute
))
```

### Step 5: Handle the result

Return a structured result:

```python
ToolResult(
    for_llm="File contents here",  # Required: sent to LLM
    for_user="Displayed content",   # Optional: shown to user
    silent=False,                   # Don't show anything to user
    is_error=False,                 # Indicates failure
    async_=False                    # Operation continues in background
)
```

## Examples

### Example 1: File system tool

```python
def write_file(path: str, content: str) -> ToolResult:
    """Write content to a file, creating it if needed."""
    try:
        with open(path, 'w') as f:
            f.write(content)
        return ToolResult(
            for_llm=f"Successfully wrote {len(content)} bytes to {path}",
            silent=True  # Don't show to user
        )
    except Exception as e:
        return ToolResult(for_llm=f"Error writing file: {e}", is_error=True)
```

### Example 2: Web search tool

```python
def web_search(query: str, max_results: int = 5) -> ToolResult:
    """Search the web for information."""
    try:
        results = search_api.search(query, limit=max_results)
        formatted = "\n".join([f"- {r.title}: {r.snippet}" for r in results])
        return ToolResult(
            for_llm=formatted,
            for_user=formatted  # Show results to user too
        )
    except Exception as e:
        return ToolResult(for_llm=f"Search failed: {e}", is_error=True)
```

### Example 3: Shell execution tool

```python
def exec_command(command: str, timeout: int = 30) -> ToolResult:
    """Execute a shell command."""
    try:
        result = subprocess.run(
            command, shell=True, capture_output=True,
            timeout=timeout, text=True
        )
        output = result.stdout or result.stderr
        return ToolResult(
            for_llm=f"Exit code: {result.returncode}\n{output}",
            for_user=output
        )
    except subprocess.TimeoutExpired:
        return ToolResult(for_llm="Command timed out", is_error=True)
```

### Example 4: Async background tool

```python
def spawn_task(task: str, callback: Callable) -> ToolResult:
    """Start a background task."""
    task_id = generate_id()

    # Start in background thread
    threading.Thread(target=run_task, args=(task_id, task, callback)).start()

    return ToolResult(
        for_llm=f"Task {task_id} started in background",
        async_=True  # Indicates background operation
    )
```

## Best practices

### Naming

- **Good**: `read_file`, `web_search`, `send_message`
- **Bad**: `doSomethingWithFile`, `tool1`, `utility`

### Descriptions

- **Good**: "Read the contents of a file at the given path. Returns the full file content as text."
- **Bad**: "File reader"

### Design principles

1. **Single responsibility** - One tool does ONE thing well
2. **Clear naming** - Name tells you what it does
3. **Descriptive parameters** - Each parameter is self-documenting
4. **Graceful errors** - Return clear error messages, don't crash
5. **Safe defaults** - Optional parameters have sensible defaults
6. **Input validation** - Check inputs before acting
7. **Path security** - Validate paths are within allowed directories

### Anti-patterns to avoid

- **God tools** - One tool that does everything
- **Unclear naming** - `util`, `helper`, `process`
- **Missing validation** - Accepting any input blindly
- **Silent failures** - Errors that don't get reported
- **Blocking operations** - Long tasks that freeze the agent
- **Unbounded output** - Returning huge amounts of data to LLM

## Requirements

### Tool interface

```python
class Tool:
    name: str           # Unique identifier
    description: str    # What it does and when to use
    parameters: dict    # JSON Schema for arguments
    execute: Callable   # Function to run
```

### Result interface

```python
class ToolResult:
    for_llm: str        # Content for LLM context (required)
    for_user: str       # Content for user display (optional)
    silent: bool        # Hide from user (default: False)
    is_error: bool      # Indicates failure (default: False)
    async_: bool        # Background operation (default: False)
```

### Common tool categories

| Category      | Examples                                   |
| ------------- | ------------------------------------------ |
| File system   | read_file, write_file, edit_file, list_dir |
| Execution     | exec, shell, subprocess                    |
| Web           | web_search, web_fetch, api_call            |
| Communication | message, notify, email                     |
| Data          | query_db, cache_get, cache_set             |

### Dependencies

- JSON Schema validator for parameter validation
- Subprocess module for shell execution
- HTTP client for web tools
- Threading for async operations
