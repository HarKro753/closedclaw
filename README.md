<div align="center">

# ClosedClaw

**An agent OS for organizations. Every person gets their own AI agent.**

[![CI](https://github.com/HarKro753/closedclaw/actions/workflows/ci.yml/badge.svg)](https://github.com/HarKro753/closedclaw/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Docker](https://img.shields.io/badge/docker-compose-blue?logo=docker)](https://github.com/HarKro753/closedclaw)

</div>

---

ClosedClaw is a self-hosted platform where every user in your organization gets a personal AI agent. Each agent has its own persistent memory, private workspace, skill system, and full tool access — including bash, file editing, web browsing, and web search. Deploy with Docker Compose.

## Screenshots

> Deploy locally to see the full UI — clean dark theme, indigo accents.

## Features

- **One agent per user** — isolated workspace, memory, and skill set per account
- **13 built-in tools** — bash execution, read/write/edit/delete files, web search, web fetch, memory search, daily notes, skill management
- **Memory system** — `MEMORY.md` for long-term memory + daily `memory/YYYY-MM-DD.md` notes + full-text `memory_search` across all files
- **Skill system** — drop a `SKILL.md` into your agent's `skills/` directory; the agent auto-discovers and loads it on demand
- **SSE streaming** — agent responses stream token-by-token to the dashboard via Server-Sent Events
- **Clean dark UI** — minimal dashboard inspired by the best open-source chat UIs
- **Org admin dashboard** — 4-tab admin panel: overview stats, agents, centralized skill library, and task dispatch
- **Task dispatch** — send tasks to any agent in your org; each agent processes it through their human's context (memory, skills, SOUL.md)
- **CLI for local dev** — interactive REPL with slash commands (`/memory`, `/soul`, `/skills`, `/clear`)
- **Self-hosted** — all data stays on your infrastructure

## Agent Tools

| Tool | Description |
|------|-------------|
| `read_memory` | Read long-term memory (`MEMORY.md`) |
| `write_memory` | Write or append to long-term memory |
| `memory_daily_read` | Read today's daily notes |
| `memory_daily_write` | Append to today's daily notes |
| `memory_search` | Full-text search across all memory files |
| `read_file` | Read a file from the agent's workspace |
| `write_file` | Write a file to the agent's workspace |
| `edit_file` | Surgical find-and-replace edit of a file |
| `delete_file` | Delete a file from the workspace |
| `list_files` | List files in the workspace |
| `bash` | Execute shell commands (scoped to workspace) |
| `web_search` | Search the web via Brave Search API |
| `web_fetch` | Fetch and extract content from a URL |
| `list_skills` | List available skills |
| `read_skill` | Load a skill's instructions |

## Quick Start

```bash
git clone https://github.com/HarKro753/closedclaw.git
cd closedclaw

# Create .env file
cat > .env << EOF
JWT_SECRET=your-secret-here
ANTHROPIC_API_KEY=sk-ant-...
ADMIN_EMAILS=you@example.com
EOF

docker compose up
```

Dashboard: [http://localhost:3901](http://localhost:3901) · API: [http://localhost:3900](http://localhost:3900)

## Local Development

Requires [Bun](https://bun.sh) 1.0+.

```bash
bun install

# Start server (port 3900)
bun run dev:server

# Start dashboard (port 3901)
bun run dev:dashboard
```

## CLI

```bash
# Run without installing
npx closedclaw

# Or install globally
npm install -g closedclaw && closedclaw
```

The CLI launches an interactive agent session locally — same runtime as the server, useful for testing skills and tools without deploying.

## Architecture

```
closedclaw/
  packages/
    server/      → Bun + Express API (auth, agent runtime, tools, SQLite)
    dashboard/   → Next.js 15 frontend (chat UI, SSE streaming, admin panel)
    cli/         → Local dev REPL
```

The agent runtime lives inside `packages/server/src/agent/` — it uses `@anthropic-ai/claude-agent-sdk` and exposes tools via an MCP server.

## API

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/register` | Create account and provision agent |
| `POST` | `/auth/login` | Sign in, receive JWT |
| `GET` | `/auth/me` | Current user info |

### Agent

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/agent/message` | Send message, get full response |
| `POST` | `/agent/message/stream` | Send message, stream response via SSE |
| `GET` | `/agent/history` | Conversation history |
| `DELETE` | `/agent/history` | Clear history |

### Skills

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/skills` | List global skills |
| `POST` | `/skills` | Create global skill (admin) |
| `GET` | `/skills/agent` | List current user's agent skills |
| `POST` | `/skills/agent` | Add skill to current user's agent |
| `DELETE` | `/skills/agent/:name` | Remove skill |

### Admin

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/admin/users` | List all users with agent status |
| `DELETE` | `/admin/users/:id` | Deactivate a user |
| `POST` | `/admin/agents/:userId/message` | Dispatch task to any agent (runs through that user's context) |
| `POST` | `/admin/agents/:userId/message/stream` | Same, streamed via SSE |
| `GET` | `/admin/agents/:userId/skills` | List skills for a specific agent |
| `GET` | `/admin/agents/:userId/memory` | Read an agent's memory summary |

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | Yes | — | Anthropic API key for Claude |
| `JWT_SECRET` | Yes | — | Secret string for signing JWTs |
| `ADMIN_EMAILS` | No | — | Comma-separated admin email addresses |
| `BRAVE_API_KEY` | No | — | Enables `web_search` tool |
| `PORT` | No | `3900` | Server port |
| `DATA_DIR` | No | `data` | Directory for SQLite DB and agent workspaces |

## Skills

Drop a `SKILL.md` file into any agent's workspace under `skills/<name>/SKILL.md`. The agent will discover it automatically and can load it on request.

```
/data/agents/<userId>/workspace/skills/
  github/
    SKILL.md    ← "Use the gh CLI for GitHub operations..."
  notion/
    SKILL.md    ← "Query the Notion API..."
```

## License

[MIT](LICENSE)
