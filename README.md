<div align="center">

# ClosedClaw

**Personal AI agents for everyone.**

[![npm version](https://img.shields.io/npm/v/closedclaw)](https://www.npmjs.com/package/closedclaw)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Docker](https://img.shields.io/badge/docker-compose-blue?logo=docker)](https://github.com/HarKro753/closedclaw)

</div>

---

ClosedClaw is a self-hosted multi-agent platform. Every user gets a personal AI agent with its own memory, workspace, and skills — managed through a web dashboard or local CLI. Deploy with Docker Compose, develop locally with `npx closedclaw`.

## Features

- **One agent per user** — each agent has an isolated workspace and persistent memory
- **Memory system** — agents retain context across conversations via `MEMORY.md`
- **Skill system** — install reusable skill files (global or per-agent) that shape agent behavior
- **Web dashboard** — responsive chat UI with admin panel for user and agent management
- **CLI for local dev** — interactive REPL with slash commands (`/memory`, `/soul`, `/skills`, `/clear`)
- **Web search** — optional Brave Search integration for grounded responses
- **Self-hosted** — runs entirely on your infrastructure with `docker compose up`

## Quick Start

```bash
git clone https://github.com/HarKro753/closedclaw.git
cd closedclaw

cp .env.example .env
# Set JWT_SECRET in .env (auth uses ~/.claude — no API key needed)

docker compose up
```

Dashboard: [http://localhost:3901](http://localhost:3901) | API: [http://localhost:3900](http://localhost:3900)

## CLI

For local development and testing, use the CLI package directly:

```bash
# Install globally
npm install -g closedclaw

# Start the REPL
closedclaw

# Or run without installing
npx closedclaw
```

The CLI launches an interactive agent session on your machine. It uses the same agent runtime as the server but runs locally with its own workspace and memory. Useful for development, testing skills, and quick interactions without deploying the full stack.

## Architecture

```
closedclaw/
  packages/
    agent/       → Agent runtime (Claude SDK, tools, memory)
    server/      → Express API (auth, agent orchestration, SQLite)
    dashboard/   → Next.js 15 frontend (chat UI, admin panel)
    cli/         → Local dev REPL (interactive agent session)
```

## API Reference

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/signup` | Create account and provision agent |
| `POST` | `/auth/login` | Sign in, receive JWT |
| `GET` | `/auth/me` | Current user info |

### Agent

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/agent/message` | Send message to your agent |
| `GET` | `/agent/history` | Conversation history |
| `DELETE` | `/agent/history` | Clear history |

### Skills

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/skills` | List global skills |
| `POST` | `/skills` | Create global skill (admin) |
| `DELETE` | `/skills/:name` | Delete global skill (admin) |
| `GET` | `/skills/agent` | List current user's agent skills |
| `POST` | `/skills/agent` | Add skill to current user's agent |
| `DELETE` | `/skills/agent/:name` | Remove skill from current user's agent |

### Admin

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/admin/users` | List all users with agent status |
| `DELETE` | `/admin/users/:id` | Deactivate a user |

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `JWT_SECRET` | Yes | — | Random string for signing JWTs |
| `ADMIN_EMAILS` | No | — | Comma-separated admin email addresses |
| `BRAVE_API_KEY` | No | — | Brave Search API key (enables web search tool) |
| `PORT` | No | `3900` | Server port |
| `DATA_DIR` | No | `data` | Directory for SQLite database and agent workspaces |

> Auth is handled by `@anthropic-ai/claude-agent-sdk` via `~/.claude`. No `ANTHROPIC_API_KEY` needed.

## Self-Hosting

ClosedClaw runs as two containers (server + dashboard) with a shared data volume for SQLite and agent workspaces. All persistent data lives in the `closedclaw-data` Docker volume. Back up this volume to preserve user accounts, conversation history, and agent memory.

```bash
docker compose up -d
```

## License

[MIT](LICENSE)
