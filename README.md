# Rubber Duck

A portable **agent skill** for rubber-duck debugging: your coding agent indexes the repo and reasons; you talk to a duck in the browser while replies stream back live.

Works with **GitHub Copilot**, Cursor, and other agents that support [Agent Skills](https://agentskills.io/).

## Install (any project)

Needs [GitHub CLI](https://cli.github.com/) **2.90+** (`gh --version`).

**Everywhere on your machine (recommended):**

```bash
gh skill install shourya0523/rubberduck rubber-duck --scope user
```

**Just this repo (project scope):**

```bash
gh skill install shourya0523/rubberduck rubber-duck
```

Interactive picker:

```bash
gh skill install shourya0523/rubberduck
```

Update later:

```bash
gh skill update rubber-duck
```

Then reload VS Code / start a **new** Copilot **Agent** chat.

> Until this lands on `main`, install from the skill branch:
> `gh skill install shourya0523/rubberduck rubber-duck --scope user --pin local/webp-duck-states-9464`

Also install **Node.js** (`node -v`) — the duck UI bridge needs it.

## Trigger

1. Open any project in VS Code  
2. Copilot Chat → **Agent** mode  
3. Say: **Start a rubber duck session**  
4. Open the URL the agent prints (usually `http://127.0.0.1:3847/`) in Chrome or Edge  
5. Talk or type to the duck  

Slash-style also works in some hosts: `/rubber-duck`

## Manual run (no agent)

```bash
node .github/skills/rubber-duck/scripts/bridge.mjs
# or wherever gh installed it, e.g. ~/.copilot/skills/rubber-duck/scripts/bridge.mjs
```

## How it fits together

1. The skill (`.github/skills/rubber-duck/SKILL.md`) tells the agent when and how to run a session.
2. `scripts/bridge.mjs` serves the UI on localhost and relays messages over SSE.
3. You speak (Web Speech API) or type; the agent waits on `bridge.mjs wait`, thinks with repo tools, then streams tokens with `bridge.mjs token` / `done`.

```text
You (mic) → HTML → POST /utterance → agent waits
agent → POST /stream (tokens) → SSE → HTML (live)
```

## Agent CLI cheatsheet

```bash
BRIDGE=~/.copilot/skills/rubber-duck/scripts/bridge.mjs   # after --scope user
# or: BRIDGE=.github/skills/rubber-duck/scripts/bridge.mjs  # in this repo

node "$BRIDGE"                 # terminal A — keep running
node "$BRIDGE" wait            # agent loop
node "$BRIDGE" say --state thinking
node "$BRIDGE" token "What happens if that map is empty?"
node "$BRIDGE" done --state excited
```

Env vars: `RUBBERDUCK_HOST` (default `127.0.0.1`), `RUBBERDUCK_PORT` (default `3847`).

## Duck animation

State loops are animated WebPs (split from `assets/source/duck-anim.webp`):

- `assets/duck-base.webp`
- `assets/duck-thinking.webp`
- `assets/duck-excited.webp`

Re-split after replacing the source film:

```bash
pip install Pillow   # once
node .github/skills/rubber-duck/scripts/split-duck-webps.mjs
```

## Layout

```text
.github/skills/rubber-duck/   # Copilot project skill
  SKILL.md
  scripts/bridge.mjs
  scripts/split-duck-webps.mjs
  app/index.html
  assets/duck-*.webp
  assets/source/duck-anim.webp
skills/rubber-duck -> ../.github/skills/rubber-duck   # gh skill install discovery
```

## Hard constraints (v1)

- Speech recognition in the HTML (Chrome/Edge).
- Streaming agent replies over SSE (no waiting for a full blob).
- No runtime CDN — local WebP loops only.

Reach goals (stubbed / ignored for now): diagram events, duck TTS.
