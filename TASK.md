# Task: Build ClosedClaw V1

## What you're building

ClosedClaw is an organizational multi-agent OS. **V1 goal:** Every user who signs up gets their own personal AI agent running in an isolated environment on the same machine.

This is the foundation. No agent-to-agent communication in V1. Just: login, get your agent, talk to it.

## V1 Acceptance Criteria

- [ ] Users can sign up with email + password
- [ ] Users can log in and see their personal dashboard
- [ ] Every user has a personal agent assigned at signup
- [ ] Each agent runs in its own isolated environment (separate workspace directory, separate memory)
- [ ] Users can chat with their agent through the dashboard
- [ ] Admins can see all users and their agents
- [ ] Self-hostable: `docker compose up` starts the whole stack
- [ ] npm installable for local dev

## Architecture

Three packages in a monorepo:

```
closedclaw/
  packages/
    server/        → Node.js/TypeScript backend (auth + agent orchestration)
    dashboard/     → Next.js frontend (login, chat, admin)
    agent/         → Claude SDK agent runtime (runs per-user)
  docker-compose.yml
  package.json     → npm workspaces root
```

## packages/server

Express or Hono TypeScript server. Handles:

### Auth

- `POST /auth/signup` — creates user + provisions agent environment
- `POST /auth/login` — returns JWT
- `GET /auth/me` — current user

### Users (admin only)

- `GET /admin/users` — list all users with agent status
- `DELETE /admin/users/:id` — deactivate user

### Agent

- `POST /agent/message` — send a message to the user's agent, returns response
- `GET /agent/history` — conversation history for this user
- `DELETE /agent/history` — clear conversation history

### Auth model

- JWT tokens (short-lived, 7 days)
- Admin role: set via env var `ADMIN_EMAILS=email1@x.com,email2@x.com`
- Passwords hashed with bcrypt
- Storage: SQLite (`data/db.sqlite`) using `better-sqlite3` — no ORM, just raw SQL

### Agent provisioning

When a user signs up:

1. Create a directory: `data/agents/<userId>/`
2. Inside it: `memory.md` (empty), `workspace/` directory
3. Store the user's agent config in SQLite

## packages/agent

The agent runtime. **Inspired by TravelAgent2 — use the Anthropic Claude SDK directly.**

```typescript
// Core interface
export async function runAgent(opts: {
  userId: string;
  message: string;
  history: Message[];
  workspaceDir: string;
  memoryFile: string;
}): Promise<string>;
```

### Agent capabilities (tools)

Give the agent these tools:

- `read_memory` — reads the user's `memory.md`
- `write_memory` — appends to or rewrites `memory.md`
- `read_file` — reads a file from the user's workspace
- `write_file` — writes a file to the user's workspace
- `list_files` — lists files in the user's workspace
- `web_search` — basic web search (use Brave API if `BRAVE_API_KEY` is set, otherwise skip)

### Model

Use `claude-opus-4-5` or `claude-sonnet-4-5` — configurable via `CLAUDE_MODEL` env var.

### System prompt

```
You are a personal AI agent for {{userName}}. You have your own persistent memory
and a personal workspace. Use your memory to remember important things across
conversations. You're part of ClosedClaw — an organizational agent OS.
```

Read `.claude/skills/agent-loop/SKILL.md` and `.claude/skills/agent-tools/SKILL.md` for implementation guidance.

## packages/dashboard

Next.js 15 + TypeScript + Tailwind. Three pages:

### `/` → redirect to `/login` if not authenticated, else `/chat`

### `/login` and `/signup`

- Clean, minimal auth forms
- JWT stored in localStorage or httpOnly cookie

### `/chat`

- Chat interface with the user's agent
- Message history loaded on mount
- Real-time feel: optimistic updates, loading state while agent responds
- Sidebar: user name, "Clear history" button, logout
- Mobile responsive

### `/admin` (admin only)

- Table of all users: email, joined date, message count, agent status
- Only accessible if user has admin role, otherwise 404

## Self-hosting

### docker-compose.yml

```
services:
  server: builds packages/server, port 3900
  dashboard: builds packages/dashboard, port 3901
```

Volumes: `data/` directory mounted into server for SQLite + agent workspaces.

### Environment variables

```
JWT_SECRET=           required (random string)
ADMIN_EMAILS=         comma-separated admin emails
BRAVE_API_KEY=        optional (enables web search tool)
PORT=                 optional (default: 3900)
# Auth via ~/.claude (claude-agent-sdk) — no API key needed
```

## File structure

```
packages/
  server/
    src/
      index.ts
      db/
        schema.ts       # SQLite table definitions (raw SQL)
        migrate.ts      # Run migrations on startup
      routes/
        auth.ts
        agent.ts
        admin.ts
      middleware/
        auth.ts         # JWT verification
        admin.ts        # Admin role check
      agent-provisioner.ts  # Create agent dirs, init memory.md
    Dockerfile
    package.json
    tsconfig.json

  dashboard/
    src/app/
      page.tsx          # Redirect logic
      login/page.tsx
      signup/page.tsx
      chat/page.tsx
      admin/page.tsx
    Dockerfile
    package.json
    next.config.ts

  agent/
    src/
      index.ts          # runAgent() export
      tools.ts          # Tool definitions (Claude tool_use format)
      system-prompt.ts  # System prompt builder
    package.json
    tsconfig.json

docker-compose.yml
.env.example
.gitignore
package.json            # workspaces root
tsconfig.json
README.md               # Professional, marketing-style, product is live
LICENSE                 # MIT
CHANGELOG.md
```

## README

Write a professional README in the style of a polished open source project. Include:

- Centered hero: project name + tagline ("Every person deserves their own AI agent")
- Badges: npm version, Docker, license
- What it is (2-3 sentences: personal agents for every org member, web dashboard, self-hosted)
- Screenshot placeholder (add `<!-- screenshot -->` where it would go)
- Quick start: `docker compose up`
- Environment variables table
- V1 feature list
- Roadmap: V2 = agent-to-agent communication, shared org memory
- License: MIT

## Quality bar

- TypeScript strict mode, zero `any`
- Build passes for all packages
- Basic tests: auth flow (signup creates user + agent dir), agent runAgent() with mocked Anthropic
- `npm run dev:server` and `npm run dev:dashboard` work

## Git & delivery

- Work on `main`, trunk-based
- `git push origin main` after every meaningful commit
- On completion: `openclaw message send --target 8186358692 --channel telegram --message "✅ Done: closedclaw v1 pushed to main — ready for review"`
