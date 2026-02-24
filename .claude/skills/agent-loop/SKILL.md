---
name: agent-loop
description: The core agentic loop pattern - how an AI agent processes messages, calls tools, and iterates until task completion. Use when building agents, debugging agent behavior, or understanding how the tool execution cycle works.
---

# The Agent Loop

The fundamental execution pattern of an AI agent: an iterative loop that transforms user requests into completed tasks through reasoning and tool use.

## Quick start

The simplest agent loop:

```
while true:
    message = receive_input()
    context = build_context(system_prompt, memory, history, message, tools)
    response = call_llm(context)

    if response.has_tool_calls:
        results = execute_tools(response.tool_calls)
        add_to_context(response, results)
        continue  # Loop again
    else:
        send_to_user(response.text)
        break  # Done
```

## Instructions

When implementing or debugging an agent loop, follow these steps:

### Step 1: Receive the message

Capture input from any channel (CLI, chat, API, webhook, cron trigger).

### Step 2: Build the context

Assemble everything the LLM needs in this order:

1. **System prompt** - Identity, capabilities, rules
2. **Memory** - Persistent facts from MEMORY.md
3. **Session history** - Previous messages in this conversation
4. **Current message** - What the user just said
5. **Tool definitions** - Available actions (JSON schemas)

### Step 3: Call the LLM

Send context to the language model. The LLM responds with either:

- **Direct answer** - Text response, no tools needed
- **Tool calls** - Requests to execute one or more tools

### Step 4: Handle the response

**If direct answer:**

```
save_to_history(response)
return_to_user(response.text)
# Loop ends
```

**If tool calls:**

```
for each tool_call in response.tool_calls:
    result = execute_tool(tool_call.name, tool_call.arguments)
    add_tool_result_to_context(tool_call.id, result)

add_assistant_message_to_context(response)
goto Step 3  # Call LLM again with tool results
```

### Step 5: Iterate safely

Continue looping until:

- LLM gives a direct answer (success)
- Maximum iterations reached (safety limit, typically 10-20)
- Error occurs (handle gracefully)
- Context cancelled (shutdown signal)

## Examples

### Example 1: Simple file read task

```
User: "What's in config.json?"

Iteration 1:
  Context: [system] + [user: "What's in config.json?"]
  LLM returns: tool_call(read_file, {path: "config.json"})

Iteration 2:
  Context: [previous] + [assistant: tool_call] + [tool: "{api_key: ...}"]
  LLM returns: "Your config.json contains an API key setting..."

Loop ends, response sent to user.
```

### Example 2: Multi-step task

```
User: "Update the timeout to 30 seconds in config.json"

Iteration 1:
  LLM: tool_call(read_file, {path: "config.json"})

Iteration 2:
  Tool result: {timeout: 10, ...}
  LLM: tool_call(edit_file, {path: "config.json", old: "timeout: 10", new: "timeout: 30"})

Iteration 3:
  Tool result: "File updated successfully"
  LLM: "I've updated the timeout from 10 to 30 seconds in config.json."

Loop ends after 3 iterations.
```

### Example 3: Error handling

```
User: "Read secret.txt"

Iteration 1:
  LLM: tool_call(read_file, {path: "secret.txt"})

Iteration 2:
  Tool result: {error: "File not found"}
  LLM: "I couldn't find secret.txt. Would you like me to search for it?"

Loop ends, error handled gracefully.
```

## Best practices

### Do:

- **Set iteration limits** - Prevent infinite loops (10-20 max iterations)
- **Preserve tool call IDs** - Link tool results to their calls
- **Handle errors gracefully** - Return errors to LLM, let it decide next step
- **Check for cancellation** - Respect shutdown signals between iterations
- **Log each iteration** - Track tool calls and results for debugging

### Don't:

- **Skip the tool result step** - LLM needs to see what tools returned
- **Ignore maximum iterations** - Runaway loops waste money and time
- **Corrupt session state on error** - Keep history consistent
- **Block on long operations** - Use async tools for slow tasks

### Common pitfalls:

- **Missing tool call ID** - Causes "orphaned tool result" errors
- **Context overflow** - Summarize history before it's too large
- **Tool execution order** - Execute all tool calls before next LLM call

## Requirements

To implement an agent loop, you need:

- **LLM API access** - OpenAI, Anthropic, or compatible provider
- **Tool registry** - Collection of available tools with schemas
- **Session storage** - Persistent storage for conversation history
- **Message bus** (optional) - For multi-channel communication

### Dependencies:

- HTTP client for LLM API calls
- JSON parser for tool arguments
- Context/cancellation support for graceful shutdown

## Reference

### Message types

| Role        | Purpose                            |
| ----------- | ---------------------------------- |
| `system`    | Agent identity and instructions    |
| `user`      | Messages from the human            |
| `assistant` | LLM responses (text or tool calls) |
| `tool`      | Results from tool execution        |

### Tool result structure

```
ToolResult {
  ForLLM:   string  // Content sent back to LLM (required)
  ForUser:  string  // Content shown to user (optional)
  Silent:   bool    // Don't show anything to user
  IsError:  bool    // Indicates failure
  Async:    bool    // Operation continues in background
}
```

### Context assembly order

```
1. System prompt (identity, time, workspace, rules)
2. Bootstrap files (SOUL.md, USER.md, IDENTITY.md, AGENT.md)
3. Skills summary (available skills)
4. Memory context (MEMORY.md + recent daily notes)
5. Tools section (available tools)
6. Session summary (if history was truncated)
7. Recent history (last N messages)
8. Current user message
```
