# Install Rubber Duck — instructions for LLMs / coding agents

**Audience:** GitHub Copilot, Cursor, Claude Code, Codex, and similar agents acting on behalf of a human.

**Goal:** Install the `rubber-duck` skill so it works in the user’s environment, then start a session if they asked for one.

Do **not** ask the user to paste long path lectures. Run the commands yourself when you have shell access. Prefer the first strategy that succeeds.

---

## Preconditions

1. Confirm **Node.js** is available: `node -v`. If missing, tell the user to install Node LTS, then stop.
2. Prefer **Chrome or Edge** for the mic (Web Speech API). Typing always works as fallback.
3. Skill source repo: `https://github.com/shourya0523/rubberduck`  
   Release pin (preferred): `v0.1.0`  
   Skill directory name: `rubber-duck`

---

## Strategy 1 — `gh skill` (best)

```bash
gh --version
```

- If version is older than **2.90.0** or `gh skill` is an unknown command → go to **Strategy 2** (do not block on upgrade unless the user wants `gh skill`).
- If `gh` is missing → Strategy 2.

Install **user scope** (all projects) for Copilot:

```bash
gh skill install shourya0523/rubberduck rubber-duck --scope user --pin v0.1.0
```

Other hosts:

```bash
gh skill install shourya0523/rubberduck rubber-duck --scope user --pin v0.1.0 --agent cursor
gh skill install shourya0523/rubberduck rubber-duck --scope user --pin v0.1.0 --agent claude-code
```

Project-only (current git repo):

```bash
gh skill install shourya0523/rubberduck rubber-duck --scope project --pin v0.1.0
```

If install complains the skill already exists, re-run with `-f` / `--force` only when the user wants a refresh.

---

## Strategy 2 — Manual copy (no `gh skill`)

Clone (or sparse-friendly download) and copy the skill folder:

```bash
git clone --depth 1 --branch v0.1.0 https://github.com/shourya0523/rubberduck.git /tmp/rubberduck-skill
mkdir -p "$HOME/.copilot/skills" "$HOME/.agents/skills"
rm -rf "$HOME/.copilot/skills/rubber-duck" "$HOME/.agents/skills/rubber-duck"
cp -R /tmp/rubberduck-skill/skills/rubber-duck "$HOME/.copilot/skills/"
cp -R /tmp/rubberduck-skill/skills/rubber-duck "$HOME/.agents/skills/"
```

If this checkout of `rubberduck` is already on disk, you may copy from its `skills/rubber-duck` instead of cloning.

**Cursor personal (optional extra):**

```bash
mkdir -p "$HOME/.cursor/skills"
rm -rf "$HOME/.cursor/skills/rubber-duck"
cp -R /tmp/rubberduck-skill/skills/rubber-duck "$HOME/.cursor/skills/"
```

**Into the currently open project only:**

```bash
mkdir -p .agents/skills
rm -rf .agents/skills/rubber-duck
cp -R /tmp/rubberduck-skill/skills/rubber-duck .agents/skills/
```

---

## Strategy 3 — Installer script from a clone

```bash
git clone --depth 1 --branch v0.1.0 https://github.com/shourya0523/rubberduck.git /tmp/rubberduck-skill
cd /tmp/rubberduck-skill
chmod +x scripts/install.sh
./scripts/install.sh --manual --scope user --force
# or, if gh >= 2.90:
./scripts/install.sh --from-github --scope user --pin v0.1.0 --force
```

---

## Verify

```bash
test -f "$HOME/.copilot/skills/rubber-duck/SKILL.md" \
  -o -f "$HOME/.agents/skills/rubber-duck/SKILL.md" \
  -o -f .agents/skills/rubber-duck/SKILL.md \
  && echo "skill files present"
```

Resolve the bridge entrypoint:

```bash
BRIDGE="$(find \
  "$HOME/.copilot/skills" "$HOME/.agents/skills" "$HOME/.cursor/skills" \
  .agents/skills skills \
  -path '*/rubber-duck/scripts/bridge.mjs' 2>/dev/null | head -n 1)"
echo "BRIDGE=$BRIDGE"
test -n "$BRIDGE"
```

---

## Start a session (after install)

1. Tell the user to open a **new Agent chat** (or reload the window) so skills are rediscovered.
2. Start the bridge in the background if you can keep a process running:

   ```bash
   node "$BRIDGE"
   ```

3. Open **http://127.0.0.1:3847/** for them (or print the URL clearly).
4. Enter the conversation loop from `SKILL.md`:

   ```bash
   node "$BRIDGE" wait
   node "$BRIDGE" say --state thinking
   # reason with repo tools…
   node "$BRIDGE" token "…"
   node "$BRIDGE" done --state excited
   ```

Persona reminder: be Socratic; stream short spoken-friendly chunks; do not silently edit code unless asked.

---

## Failure handling

| Symptom | Action |
|---------|--------|
| `unknown command "skill"` | Strategy 2; optionally suggest `brew upgrade gh` |
| Port 3847 in use | `RUBBERDUCK_PORT=3848 node "$BRIDGE"` |
| Mic missing / insecure context | Tell user to type, or use Chrome/Edge on localhost |
| Skill not triggering | Confirm `SKILL.md` path above; new Agent session; user prompt: “Start a rubber duck session” |

---

## What not to do

- Do not invent CDN URLs or npm packages for this skill.
- Do not commit copies of the skill into unrelated repos unless the user asked for a **project** install.
- Do not treat `.agents/skills` inside the *rubberduck source repo* as something to publish; that folder is an install destination elsewhere.
