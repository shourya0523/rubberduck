# Rubber Duck

A portable **agent skill** for rubber-duck debugging: your coding agent indexes the repo and reasons; you talk to a 3D duck in the browser while replies stream back live.

Works with **GitHub Copilot** (and other agents that load Agent Skills from `.github/skills/`).

## Quick start

Ask your agent:

> Open a rubber duck session for this repo.

Or start the bridge yourself:

```bash
node .github/skills/rubber-duck/scripts/bridge.mjs
```

Open the printed URL (default `http://127.0.0.1:3847/`) in **Chrome** or **Edge** for speech recognition. Type if the mic is unavailable.

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
# terminal A — keep running
node .github/skills/rubber-duck/scripts/bridge.mjs

# terminal B — agent loop
node .github/skills/rubber-duck/scripts/bridge.mjs wait
node .github/skills/rubber-duck/scripts/bridge.mjs say --state thinking
node .github/skills/rubber-duck/scripts/bridge.mjs token "What happens if that map is empty?"
node .github/skills/rubber-duck/scripts/bridge.mjs done --state excited
```

Env vars: `RUBBERDUCK_HOST` (default `127.0.0.1`), `RUBBERDUCK_PORT` (default `3847`).

## Duck models

Drop your own GLBs over these paths (same names):

- `.github/skills/rubber-duck/assets/duck-base.glb`
- `.github/skills/rubber-duck/assets/duck-thinking.glb`
- `.github/skills/rubber-duck/assets/duck-excited.glb`

Placeholder ducks ship so the skill works before you upload finals. Regenerate placeholders with:

```bash
node .github/skills/rubber-duck/scripts/make-placeholder-glbs.mjs
```

## Layout

```text
.github/skills/rubber-duck/
  SKILL.md
  scripts/bridge.mjs
  scripts/make-placeholder-glbs.mjs
  app/index.html
  assets/duck-*.glb
  assets/vendor/          # three.js (no CDN at runtime)
```

## Hard constraints (v1)

- Speech recognition in the HTML (Chrome/Edge).
- Streaming agent replies over SSE (no waiting for a full blob).
- No runtime CDN / npm install for the UI — vendored Three.js + local GLBs.

Reach goals (stubbed / ignored for now): diagram events, duck TTS.
