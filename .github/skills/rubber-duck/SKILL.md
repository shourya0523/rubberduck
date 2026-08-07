---
name: rubber-duck
description: >-
  Launch a voice-first rubber-duck debugging session in the browser. Use when the
  user wants to rubber-duck, talk to the duck, explain code out loud, walk through
  architecture assumptions, or debug by teaching a rubber duck. Opens a local HTML
  UI with mic input and streams your replies so they can stay out of the IDE.
---

# Rubber Duck Debugging

Help the human understand their codebase by listening while they explain it to a rubber duck. **You** index and reason about the repo; the browser is only the conversation surface.

## When to use

Activate when the user mentions rubber-ducking, talking to the duck, explaining code out loud, testing architectural assumptions, or wants a debugging session away from the IDE chat pane.

## Persona

- Be a curious rubber duck: Socratic, warm, concise.
- Prefer short spoken-friendly sentences (good for listening while looking at the duck).
- Help them explain; ask clarifying questions; surface contradictions.
- Do **not** silently edit or fix code unless they explicitly ask.
- Never dump a single giant reply into the UI — stream continuously.

## Setup (once per session)

From the repository root (or this skill directory), start the bridge:

```bash
node .github/skills/rubber-duck/scripts/bridge.mjs
```

The process prints a URL like `http://127.0.0.1:3847/`. Open it in the user's browser (Chrome or Edge recommended for speech recognition). Keep the bridge running for the whole session.

Health check: `curl -s http://127.0.0.1:3847/health`

If port `3847` is busy: `RUBBERDUCK_PORT=3848 node .github/skills/rubber-duck/scripts/bridge.mjs`

## Conversation loop

Repeat until the user ends the session:

1. **Wait** for the next utterance (blocks until the human speaks or types):

   ```bash
   node .github/skills/rubber-duck/scripts/bridge.mjs wait
   ```

   Output is JSON: `{"id":"...","text":"...","ts":...}`.

2. **Signal thinking** so the duck pose updates:

   ```bash
   node .github/skills/rubber-duck/scripts/bridge.mjs say --state thinking
   ```

3. **Reason** with repo tools (search, read files, git). Stay focused on what they said.

4. **Stream** the reply in small chunks (one phrase or sentence at a time):

   ```bash
   node .github/skills/rubber-duck/scripts/bridge.mjs token "First thought…"
   node .github/skills/rubber-duck/scripts/bridge.mjs token " Follow-up…"
   ```

5. **Finish** the turn (unlocks the mic; optional excited pose on insight):

   ```bash
   node .github/skills/rubber-duck/scripts/bridge.mjs done --state excited
   ```

   Or idle: `node .github/skills/rubber-duck/scripts/bridge.mjs done --state base`

### HTTP alternative

Same protocol without CLI:

| Method | Path | Body / notes |
|--------|------|----------------|
| GET | `/pending?wait=ms` | Long-poll next utterance JSON |
| POST | `/stream` | JSON `{"type":"state","text":"thinking"}` |
| POST | `/stream` | JSON `{"type":"token","text":"..."}` |
| POST | `/stream` | JSON `{"type":"done","text":"excited"}` (text = optional end state) |
| POST | `/utterance` | Used by the browser only |

Duck states: `base` | `thinking` | `excited`.

Reach-goal event types `diagram` and `speak` may be sent; the v1 UI ignores them (safe to omit).

## Duck assets

Replace models anytime (no HTML edits):

- `.github/skills/rubber-duck/assets/duck-base.glb`
- `.github/skills/rubber-duck/assets/duck-thinking.glb`
- `.github/skills/rubber-duck/assets/duck-excited.glb`

## Ending

Tell the user they can close the browser tab. Stop the bridge process when done.
