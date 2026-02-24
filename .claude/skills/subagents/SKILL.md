---
name: subagents
description: How to spawn independent agent instances for parallel task execution - async vs sync patterns, task delegation, and result handling. Use when implementing subagent systems, parallelizing tasks, or designing multi-agent workflows.
---

# Subagents

A subagent is an independent agent instance that runs its own loop, has access to tools, completes a specific task, and reports results back. Use subagents for parallel execution, background tasks, and task delegation.

## Quick start

Spawn a subagent:

```python
# Async (fire and forget)
task_id = spawn(
    task="Research Python async patterns",
    label="python-research"
)
# Returns immediately, task runs in background

# Sync (wait for result)
result = subagent(
    task="Summarize this file",
    label="file-summary"
)
# Blocks until complete, returns result
```

## Instructions

### Step 1: Decide async vs sync

| Pattern | Behavior | Use When |
|---------|----------|----------|
| **Async (spawn)** | Fire and forget, continue immediately | Independent tasks, background work |
| **Sync (subagent)** | Block and wait for result | Need result to continue, subtasks |

### Step 2: Define the task clearly

```python
# Good: Clear, specific, actionable
task = "Search for Python async patterns and summarize the top 3 approaches with code examples"

# Bad: Vague, too broad
task = "Look into Python stuff"
```

### Step 3: Spawn the subagent

**Async spawn:**
```python
task_id = spawn(
    task="Research topic X",
    label="research-x",
    callback=handle_completion  # Optional: called when done
)
# Returns immediately
print(f"Task {task_id} started")
```

**Sync subagent:**
```python
result = subagent(
    task="Analyze this data",
    label="data-analysis"
)
# Blocks until complete
print(f"Result: {result}")
```

### Step 4: Handle the result

**Async results** come via callback or message bus:
```python
def handle_completion(task_id, result):
    if result.is_error:
        log.error(f"Task {task_id} failed: {result.error}")
    else:
        process_result(result.content)
```

**Sync results** return directly:
```python
result = subagent(task="...", label="...")
if result.is_error:
    # Handle error
else:
    # Use result.content
```

### Step 5: Handle failures

```python
result = subagent(task="...", label="...")

if result.is_error:
    # Option 1: Retry
    result = subagent(task="...", label="...-retry")
    
    # Option 2: Try alternative approach
    result = subagent(task="Alternative approach...", label="...-alt")
    
    # Option 3: Report to user
    message("I encountered an error. Let me try a different approach...")
```

## Examples

### Example 1: Parallel research

```python
# User: "Research topic A and topic B, then compare them"

# Spawn parallel research tasks
spawn(task="Research topic A thoroughly", label="research-a")
spawn(task="Research topic B thoroughly", label="research-b")

# Wait for both to complete (via message bus or polling)
results = wait_for_tasks(["research-a", "research-b"])

# Now compare
comparison = subagent(
    task=f"Compare these findings:\nA: {results['a']}\nB: {results['b']}",
    label="comparison"
)
```

### Example 2: Background compilation

```python
# Start long-running task in background
spawn(
    task="Compile the project and run all tests",
    label="build-and-test",
    callback=notify_user_on_completion
)

# Continue with other work immediately
message("Build started in background. I'll let you know when it's done.")
```

### Example 3: Subtask delegation

```python
# Break complex task into subtasks
sections = ["introduction", "methods", "results", "conclusion"]

for section in sections:
    result = subagent(
        task=f"Write the {section} section based on the research notes",
        label=f"write-{section}"
    )
    document.add_section(section, result.content)
```

### Example 4: Error recovery

```python
result = subagent(task="Fetch data from API", label="api-fetch")

if result.is_error:
    # Try fallback
    result = subagent(
        task="Fetch data from backup source",
        label="backup-fetch"
    )
    
    if result.is_error:
        message("Unable to fetch data from any source. Please check connectivity.")
        return

process_data(result.content)
```

## Best practices

### When to use subagents

**Good use cases:**
- Parallel research ("Look up X, Y, and Z simultaneously")
- Background tasks ("Compile and let me know when done")
- Independent subtasks ("Generate these 5 reports")
- Long-running operations ("Download and process this dataset")

**Bad use cases:**
- Simple operations (don't spawn to read one file)
- Highly dependent tasks (if B needs A's result, do them sequentially)
- User-interactive tasks (subagents shouldn't ask questions)
- Critical path work (if user is waiting, sync is usually better)

### Task clarity

- **Be specific**: Include exactly what output you need
- **Set scope**: Define boundaries of the task
- **Specify format**: Tell subagent how to structure the result

### Resource management

- **Don't over-parallelize**: 10 subagents = 10 concurrent LLM calls
- **Set timeouts**: Prevent stuck subagents
- **Limit iterations**: Subagents have max iteration limits (typically 10)

### Subagent limitations

| Aspect | Main Agent | Subagent |
|--------|------------|----------|
| System prompt | Full (identity, memory) | Minimal (task focus) |
| Session history | Yes | No |
| Memory access | Read/write | Read only |
| Spawning | Can spawn | Cannot spawn (no recursion) |
| User interaction | Direct | Via message tool only |

## Requirements

### Task structure

```python
SubagentTask {
    id: str           # Unique identifier
    task: str         # Task description
    label: str        # Human-readable label
    origin_channel: str  # Where to send results
    origin_chat_id: str  # Who to notify
    status: str       # pending | running | completed | failed
    result: str       # Task output
    created: int      # Timestamp
}
```

### Result structure

```python
SubagentResult {
    content: str      # Task output
    is_error: bool    # Whether task failed
    iterations: int   # How many loop iterations used
    label: str        # Task label
}
```

### Execution environment

Subagents receive:
- Minimal system prompt (task-focused)
- The task as user message
- Access to tools (except spawn/subagent)
- Iteration limit (typically 10)

### Dependencies

- Task queue or threading for async execution
- Message bus for result delivery
- Tool registry (shared with main agent)
- LLM API access
