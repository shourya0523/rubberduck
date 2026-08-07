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

Needs [GitHub CLI](https://cli.github.com/) **2.90+** (`gh skill` was added in 2.90). If `gh skill` is unknown:

```bash
brew upgrade gh && gh --version
```

Or skip `gh` and use `./scripts/install.sh --manual --scope user` / the manual copy steps in [docs/INSTALL.md](docs/INSTALL.md).

Also needs **Node.js** for the duck bridge.

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

1. The skill (`skills/rubber-duck/SKILL.md`) tells the agent when and how to run a session.
2. `scripts/bridge.mjs` serves the UI on localhost and relays messages over SSE.
3. You speak (Web Speech API) or type; the agent waits on `bridge.mjs wait`, thinks with repo tools, then streams tokens with `bridge.mjs token` / `done`.

```text
You (mic) → HTML → POST /utterance → agent waits
agent → POST /stream (tokens) → SSE → HTML (live)
```

## Agent CLI cheatsheet

```bash
BRIDGE=~/.copilot/skills/rubber-duck/scripts/bridge.mjs   # after --scope user
# or: BRIDGE=skills/rubber-duck/scripts/bridge.mjs

node "$BRIDGE"
node "$BRIDGE" wait
node "$BRIDGE" say --state thinking
node "$BRIDGE" token "What happens if that map is empty?"
node "$BRIDGE" done --state excited
```

Env vars: `RUBBERDUCK_HOST` (default `127.0.0.1`), `RUBBERDUCK_PORT` (default `3847`).

## Duck animation

State loops: `assets/duck-{base,thinking,excited}.webp`  
Re-split: `node skills/rubber-duck/scripts/split-duck-webps.mjs` (needs Pillow)

## Layout

```text
skills/rubber-duck/              # canonical (gh skill install + publish)
scripts/install.sh               # multi-pathway installer
docs/INSTALL.md                  # install + publish guide
.github/skills/rubber-duck → …   # Copilot project discovery when cloning this repo
LICENSE
```

Do not commit `.agents/skills` / `.claude/skills` — those are **install destinations**, not sources.

## Hard constraints (v1)

- Speech recognition in the HTML (Chrome/Edge)
- Streaming agent replies over SSE
- No runtime CDN — local WebP loops only
