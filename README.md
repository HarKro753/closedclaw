<div align="center">

# ClosedClaw

**Every person deserves their own AI agent.**

[![npm version](https://img.shields.io/npm/v/closedclaw)](https://www.npmjs.com/package/closedclaw)
[![Docker](https://img.shields.io/badge/docker-ready-blue)](https://github.com/anomalyco/closedclaw)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

</div>

---

ClosedClaw is an organizational multi-agent OS. Every member of your team gets a personal AI agent with its own memory, workspace, and tools — accessible through a clean web dashboard. Self-hosted, open source, and ready for production.

<!-- screenshot -->

## Quick Start

```bash
# Clone the repo
git clone https://github.com/anomalyco/closedclaw.git
cd closedclaw

# Copy environment variables
cp .env.example .env
# Edit .env with your JWT_SECRET (auth via ~/.claude — no API key needed)

# Start with Docker
docker compose up
```

Dashboard: [http://localhost:3901](http://localhost:3901) | API: [http://localhost:3900](http://localhost:3900)

## Local Development

```bash
# Install dependencies
npm install

# Build the agent package first (server depends on it)
npm run build:agent

# Start server and dashboard in separate terminals
npm run dev:server
npm run dev:dashboard
```

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `JWT_SECRET` | Yes | — | Random string for signing JWTs |
| `ADMIN_EMAILS` | No | — | Comma-separated admin email addresses |
| `BRAVE_API_KEY` | No | — | Brave Search API key (enables web search tool) |
| `PORT` | No | `3900` | Server port |

> **Note:** Auth is handled by `@anthropic-ai/claude-agent-sdk` via `~/.claude` (set by `Claude Code init`). No `ANTHROPIC_API_KEY` needed.

## V1 Features

- **Personal agents** — Every user gets their own AI agent at signup
- **Isolated environments** — Each agent has separate workspace and memory
- **Persistent memory** — Agents remember across conversations
- **File workspace** — Agents can read/write files in their sandbox
- **Web search** — Optional Brave Search integration
- **Admin panel** — View all users, agents, and message counts
- **Self-hosted** — `docker compose up` runs everything
- **Clean dashboard** — Responsive chat UI with real-time updates

## Architecture

```
closedclaw/
  packages/
    agent/       → Claude SDK agent runtime (tools + memory)
    server/      → Express API (auth + agent orchestration + SQLite)
    dashboard/   → Next.js 15 frontend (login, chat, admin)
```

## API Endpoints

### Auth
- `POST /auth/signup` — Create account + provision agent
- `POST /auth/login` — Sign in, receive JWT
- `GET /auth/me` — Current user info

### Agent
- `POST /agent/message` — Send message to your agent
- `GET /agent/history` — Conversation history
- `DELETE /agent/history` — Clear history

### Admin
- `GET /admin/users` — List all users with agent status
- `DELETE /admin/users/:id` — Deactivate a user

## Roadmap

- **V2** — Agent-to-agent communication
- **V2** — Shared organizational memory
- **V2** — Agent skill marketplace
- **V3** — Multi-model support
- **V3** — Plugin system for custom tools

## License

[MIT](LICENSE)
