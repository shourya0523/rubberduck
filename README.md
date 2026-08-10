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
3. Agent runs `node scripts/setup.mjs` (bridge + browser + MCP)  
4. Talk or type to the duck  

## Manual run (no agent)

```bash
node skills/rubber-duck/scripts/setup.mjs
```

## How it fits together

1. **`setup.mjs`** — one-shot: start bridge, open UI, wire MCP configs.  
2. **Skill** (`SKILL.md`) — Socratic loop after setup.  
3. **Bridge / MCP** — short-poll wait + stream tokens (no 60s shell hang).  

```text
setup → bridge + browser + MCP
You (mic) → HTML → agent duck_wait / wait (short-poll)
agent → duck_token / stream → SSE → HTML
```

Same-host only: agent + bridge + browser on one machine (or an explicit tunnel).

## Agent CLI cheatsheet

```bash
cd ~/.copilot/skills/rubber-duck   # after --scope user
# or: cd skills/rubber-duck

node scripts/setup.mjs
node scripts/bridge.mjs wait
node scripts/bridge.mjs say --state thinking
node scripts/bridge.mjs token "What happens if that map is empty?"
node scripts/bridge.mjs done --state excited
```

Env: `RUBBERDUCK_HOST`, `RUBBERDUCK_PORT`, `RUBBERDUCK_WAIT_MS`, `RUBBERDUCK_NO_OPEN=1`.

## Duck

Duck OS UI: hand-drawn CSS pixel art. State changes are CSS-driven (`data-state="base|thinking|excited"`), with listening shown as a separate UI phase.

## Layout

```text
skills/rubber-duck/              # canonical (gh skill install + publish)
  scripts/setup.mjs              # one-shot: bridge + browser + MCP
  scripts/bridge.mjs             # HTTP + short-poll CLI
  scripts/mcp.mjs                # stdio MCP tools
  references/mcp.md              # MCP notes (setup wires configs)
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
- No runtime CDN — duck is bundled CSS pixel art
