# Rubber Duck

A portable **agent skill** for rubber-duck debugging: your coding agent indexes the repo and reasons; you talk to a duck in the browser while replies stream back live.

Works with **GitHub Copilot**, Cursor, Claude Code, Codex, and other [Agent Skills](https://agentskills.io/) hosts.

## Install

Full guide: **[docs/INSTALL.md](docs/INSTALL.md)** (CLI install, preview, pin, publish).

**Fastest (personal, all projects):**

```bash
gh skill preview shourya0523/rubberduck rubber-duck   # inspect first
gh skill install shourya0523/rubberduck rubber-duck --scope user
```

**From this clone:**

```bash
./scripts/install.sh --scope user
./scripts/install.sh --scope user --agent cursor
./scripts/install.sh --manual --scope user
```

Needs [GitHub CLI](https://cli.github.com/) **2.90+** for `gh skill`, and **Node.js** for the duck bridge.

Maintainers: `gh skill publish --dry-run` then `gh skill publish --tag v0.1.0`.

## Trigger

1. Reload IDE → Copilot/Cursor **Agent** chat  
2. Say: **Start a rubber duck session**  
3. Open `http://127.0.0.1:3847/` in Chrome or Edge  
4. Talk or type to the duck  

## Manual run (no agent)

```bash
node skills/rubber-duck/scripts/bridge.mjs
```

## How it fits together

1. **Skill** (`SKILL.md`) — when/how to rubber-duck (Socratic loop).
2. **Bridge** (`scripts/bridge.mjs`) — localhost UI + SSE relay.
3. **MCP** (`scripts/mcp.mjs`) — short-poll `duck_wait` + stream tools for Copilot/Cursor (no 60s shell hang).
4. You speak or type; the agent polls for utterances, reasons with repo tools, streams tokens back.

```text
You (mic) → HTML → POST /utterance → agent duck_wait / wait (short-poll)
agent → duck_token / POST /stream → SSE → HTML (live)
```

Same-host only: agent + bridge + browser on one machine (or an explicit tunnel).

MCP wiring: [skills/rubber-duck/references/mcp.md](skills/rubber-duck/references/mcp.md).

## Agent CLI cheatsheet

```bash
BRIDGE=~/.copilot/skills/rubber-duck/scripts/bridge.mjs   # after --scope user
# or: BRIDGE=skills/rubber-duck/scripts/bridge.mjs

node "$BRIDGE"
node "$BRIDGE" wait                 # ~3s poll; {"pending":true} or utterance
node "$BRIDGE" say --state thinking
node "$BRIDGE" token "What happens if that map is empty?"
node "$BRIDGE" done --state excited
```

Env vars: `RUBBERDUCK_HOST` (default `127.0.0.1`), `RUBBERDUCK_PORT` (default `3847`), `RUBBERDUCK_WAIT_MS` (default `3000`).

## Duck

WebP state loops (`duck-base|thinking|excited.webp` + posters) with an atmospheric warm-light background.

## Layout

```text
skills/rubber-duck/              # canonical (gh skill install + publish)
  scripts/bridge.mjs             # HTTP + short-poll CLI
  scripts/mcp.mjs                # stdio MCP tools
  references/mcp.md              # Copilot / Cursor MCP config
scripts/install.sh               # multi-pathway installer
docs/INSTALL.md                  # install + publish guide
.github/skills/rubber-duck → …   # Copilot project discovery when cloning this repo
LICENSE
```

Do not commit `.agents/skills` / `.claude/skills` — those are **install destinations**, not sources.

## Hard constraints (v1)

- Speech recognition in the HTML (Chrome/Edge)
- Streaming agent replies over SSE
- Short-poll wait (never rely on long-blocking shell waits)
- Agent and browser share localhost
