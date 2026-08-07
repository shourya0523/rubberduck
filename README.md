# Rubber Duck

A portable **agent skill** that turns rubber-duck debugging into a voice session with your coding agent: you talk to a duck in the browser; the agent keeps the codebase in context and streams answers back live.

Works with **GitHub Copilot**, Cursor, Claude Code, Codex, and other [Agent Skills](https://agentskills.io/) hosts.

## Why rubber ducks?

**Rubber duck debugging** is the practice of explaining your code, out loud, to an inanimate object — classically a rubber duck — until the bug or bad assumption surfaces. It comes from *The Pragmatic Programmer* (Andrew Hunt & David Thomas, 1999): a developer kept a rubber duck on their desk and walked through code line by line, narrating to the duck. Saying the logic aloud forces you to fill gaps you’d skip when “explaining” only inside your head.

The duck doesn’t know anything. That’s the point. **You** do the understanding; the duck is a patient listener.

## What this skill adds

Classic rubber-ducking is powerful but lonely: no one pushes back when your story is inconsistent, and you stay glued to the IDE. This skill keeps the duck ritual and adds an agent that actually knows the repo.

| Classic duck | This skill |
|--------------|------------|
| You narrate; silence answers | You narrate; the agent asks Socratic questions with codebase context |
| Stuck in the editor | Browser duck UI — talk with your voice, watch the duck react |
| Easy to skip “saying it out loud” | Mic-first loop makes explanation the main action |
| No shared memory of the session | Streamed replies + optional conversation log |

**Value in practice**

- **Surface the real bug** by forcing a clear explanation before (or instead of) jumping to a fix.
- **Test architecture assumptions** by walking a design out loud while the agent checks the tree.
- **Stay out of chat-pane thrash** — the duck page is a single composition: duck, caption, Talk.
- **Keep agency with you** — the skill is Socratic by design; it shouldn’t silently rewrite your code unless you ask.

## Install

- **Humans:** [docs/INSTALL.md](docs/INSTALL.md)
- **Coding agents / LLMs installing for a user:** [docs/INSTALL-FOR-LLMS.md](docs/INSTALL-FOR-LLMS.md)

**Fastest (personal, all projects)** — needs GitHub CLI **2.90+**:

```bash
gh skill install shourya0523/rubberduck rubber-duck --scope user --pin v0.1.0
```

If you see `unknown command "skill" for "gh"`:

```bash
brew upgrade gh && gh --version   # need >= 2.90
```

Or skip `gh skill` entirely:

```bash
./scripts/install.sh --manual --scope user
```

Also needs **Node.js** for the local duck bridge.

## Trigger

1. Reload the IDE → open **Agent** chat (Copilot / Cursor / etc.)
2. Say: **Start a rubber duck session**
3. Open `http://127.0.0.1:3847/` in Chrome or Edge
4. Talk (or type) to the duck

## How it fits together

1. [`skills/rubber-duck/SKILL.md`](skills/rubber-duck/SKILL.md) tells the agent when and how to run a session.
2. `scripts/bridge.mjs` serves the duck UI on localhost and relays messages over SSE.
3. You speak; the agent waits, reasons with repo tools, and streams tokens back to the page.

```text
You (mic) → HTML → POST /utterance → agent waits
agent → POST /stream (tokens) → SSE → HTML (live)
```

## Manual run (no agent)

```bash
node skills/rubber-duck/scripts/bridge.mjs
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

## Layout

```text
skills/rubber-duck/           # canonical skill (gh skill install + publish)
scripts/install.sh
docs/INSTALL.md               # human install
docs/INSTALL-FOR-LLMS.md      # agent/LLM install playbook
.github/skills/rubber-duck → skills/rubber-duck
LICENSE
```

## Maintainers

```bash
gh skill publish --dry-run
gh skill publish --tag v0.1.0
```
