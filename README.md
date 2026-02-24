<div align="center">

# ClosedClaw

**An agent OS for organizations. Every person gets their own AI agent.**

[![CI](https://github.com/HarKro753/closedclaw/actions/workflows/ci.yml/badge.svg)](https://github.com/HarKro753/closedclaw/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Docker](https://img.shields.io/badge/docker-compose-blue?logo=docker)](https://github.com/HarKro753/closedclaw)

</div>

---

ClosedClaw is a self-hosted platform where every user in your organization gets a personal AI agent. Each agent IS an [OpenClaw](https://openclaw.ai) agent — with full access to bash, browser, memory, skills, and every tool OpenClaw provides. ClosedClaw adds: multi-user auth, org admin dashboard, centralized skill management, and cross-agent task dispatch.

## Architecture

```
ClosedClaw Dashboard (Next.js)
    | REST API
ClosedClaw Server (Bun + Express)
    | WebSocket (OpenClaw Gateway Protocol)
OpenClaw Gateway (ws://localhost:18789)
    | routes to
Agent "alice"  | Agent "bob"  | Agent "carol"
(her workspace,| (his config) | (her skills)
 tools, memory)|              |
```

ClosedClaw is an **organizational management layer** on top of [OpenClaw](https://openclaw.ai).
Each user's agent IS an OpenClaw agent — with full access to bash, browser, memory, skills,
and every tool OpenClaw provides. ClosedClaw adds: multi-user auth, org admin dashboard,
centralized skill management, and cross-agent task dispatch.

## Screenshots

> Deploy locally to see the full UI — clean dark theme, indigo accents, Mission Control-style layout.

## Features

- **One agent per user** — isolated workspace, memory, and skill set per account
- **Full OpenClaw tool access** — bash, browser, files, memory, skills, web search, TTS, and more
- **Powered by OpenClaw Gateway** — every agent has the same capabilities as a standalone OpenClaw agent
- **Memory system** — `MEMORY.md` for long-term memory + daily `memory/YYYY-MM-DD.md` notes + full-text search across all files
- **Skill system** — drop a `SKILL.md` into your agent's `skills/` directory; the agent auto-discovers and loads it on demand
- **SSE streaming** — agent responses stream token-by-token to the dashboard via Server-Sent Events
- **Mission Control UI** — dark dashboard with gateway status indicator, breadcrumb navigation, and agent capability display
- **Org admin dashboard** — 4-tab admin panel: overview stats, agents, centralized skill library, and task dispatch
- **Task dispatch** — send tasks to any agent in your org; each agent processes it through their human's context (memory, skills, SOUL.md)
- **Gateway status monitoring** — real-time connection status indicator with offline banner
- **Self-hosted** — all data stays on your infrastructure

## Requirements

- [OpenClaw](https://openclaw.ai) installed and gateway running (`openclaw gateway start`)
- [Bun](https://bun.sh) 1.0+ (for local development)

## Quick Start

```bash
git clone https://github.com/HarKro753/closedclaw.git
cd closedclaw

# Start OpenClaw Gateway first
openclaw gateway start

# Create .env file
cat > .env << EOF
JWT_SECRET=your-secret-here
ADMIN_EMAILS=you@example.com
OPENCLAW_GATEWAY_URL=ws://127.0.0.1:18789
EOF

docker compose up
```

Dashboard: [http://localhost:3901](http://localhost:3901) · API: [http://localhost:3900](http://localhost:3900)

## Local Development

Requires [Bun](https://bun.sh) 1.0+.

```bash
bun install

# Start OpenClaw Gateway
openclaw gateway start

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

The CLI launches an interactive agent session locally — useful for testing skills and tools without deploying.

## API

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/signup` | Create account, provision agent, register with Gateway |
| `POST` | `/auth/login` | Sign in, receive JWT |
| `GET` | `/auth/me` | Current user info |

### Agent

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/agent/message` | Send message via Gateway, poll for response |
| `POST` | `/agent/message/stream` | Send message, stream response via SSE + Gateway events |
| `GET` | `/agent/history` | Conversation history |
| `DELETE` | `/agent/history` | Clear history |
| `GET` | `/agent/gateway-status` | Check Gateway connection status |

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
| `POST` | `/admin/agents/:userId/message` | Dispatch task to any agent via Gateway |
| `POST` | `/admin/agents/:userId/message/stream` | Same, streamed via SSE |
| `GET` | `/admin/agents/:userId/skills` | List skills for a specific agent |
| `GET` | `/admin/agents/:userId/memory` | Read an agent's memory summary |

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `JWT_SECRET` | Yes | — | Secret string for signing JWTs |
| `OPENCLAW_GATEWAY_URL` | No | `ws://127.0.0.1:18789` | OpenClaw Gateway WebSocket URL |
| `OPENCLAW_AUTH_TOKEN` | No | — | Auth token for OpenClaw Gateway (from OpenClaw config) |
| `ADMIN_EMAILS` | No | — | Comma-separated admin email addresses |
| `PORT` | No | `3900` | Server port |
| `DATA_DIR` | No | `data` | Directory for SQLite DB and agent workspaces |

## Skills

Drop a `SKILL.md` file into any agent's workspace under `skills/<name>/SKILL.md`. The agent will discover it automatically and can load it on request.

```
/data/agents/<userId>/workspace/skills/
  github/
    SKILL.md    <- "Use the gh CLI for GitHub operations..."
  notion/
    SKILL.md    <- "Query the Notion API..."
```

## License

[MIT](LICENSE)
