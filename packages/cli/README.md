# closedclaw

Personal AI agents for everyone — local dev CLI.

ClosedClaw CLI gives you an interactive agent session on your machine. Same runtime as the hosted server, but runs locally with its own workspace and memory.

## Install

```bash
npm install -g closedclaw
```

## Usage

```bash
# Start the REPL
closedclaw

# Or run without installing
npx closedclaw
```

## Slash Commands

| Command | Description |
|---------|-------------|
| `/memory` | Show the agent's current MEMORY.md |
| `/soul` | Show the agent's SOUL.md identity file |
| `/skills` | List installed skills |
| `/clear` | Clear session history |
| `/quit` | Exit the REPL |

## Requirements

- Node.js 18+
- `~/.claude` configured (run `claude` to set up)

## License

[MIT](https://github.com/HarKro753/closedclaw/blob/main/LICENSE)
