# Install Rubber Duck

Pick a pathway. All of them need **Node.js** (`node -v`) for the duck bridge. Chrome or Edge is best for the mic.

After any install: reload the IDE → **Agent** chat → **Start a rubber duck session**.

---

## Pathway A — GitHub CLI (recommended)

Needs [GitHub CLI](https://cli.github.com/) **2.90+**.

### A1. Personal skill (every project on this machine)

```bash
gh skill install shourya0523/rubberduck rubber-duck --scope user
```

### A2. Project skill (this repo only)

```bash
cd your-project
gh skill install shourya0523/rubberduck rubber-duck --scope project
```

### A3. Another agent host (Cursor, Claude Code, …)

```bash
gh skill install shourya0523/rubberduck rubber-duck --scope user --agent cursor
gh skill install shourya0523/rubberduck rubber-duck --scope user --agent claude-code
gh skill install shourya0523/rubberduck rubber-duck --scope user --agent codex
```

### A4. Pin a branch / tag / commit

```bash
gh skill install shourya0523/rubberduck rubber-duck --scope user --pin local/webp-duck-states-9464
```

### A5. From a local clone

```bash
git clone https://github.com/shourya0523/rubberduck.git
cd rubberduck
gh skill install . rubber-duck --from-local --scope user
```

Update later: `gh skill update rubber-duck`

---

## Pathway B — Installer script (this repo)

From a clone of this repository:

```bash
git clone https://github.com/shourya0523/rubberduck.git
cd rubberduck
chmod +x scripts/install.sh

# personal Copilot skill
./scripts/install.sh --scope user

# this git repo only
./scripts/install.sh --scope project

# Cursor, user-wide
./scripts/install.sh --scope user --agent cursor

# no gh CLI — plain file copy
./scripts/install.sh --manual --scope user

# install from GitHub instead of local files
./scripts/install.sh --from-github --scope user
```

---

## Pathway C — Manual copy (no `gh`)

### C1. Personal (all projects)

```bash
git clone https://github.com/shourya0523/rubberduck.git /tmp/rubberduck
mkdir -p ~/.copilot/skills ~/.agents/skills

cp -R /tmp/rubberduck/skills/rubber-duck ~/.copilot/skills/
cp -R /tmp/rubberduck/skills/rubber-duck ~/.agents/skills/
```

Cursor-only personal path (also useful):

```bash
mkdir -p ~/.cursor/skills
cp -R /tmp/rubberduck/skills/rubber-duck ~/.cursor/skills/
```

### C2. Into another project (team / repo-local)

```bash
# from the other project's root
mkdir -p .agents/skills .github/skills
cp -R /path/to/rubberduck/skills/rubber-duck .agents/skills/
ln -sfn ../.agents/skills/rubber-duck .github/skills/rubber-duck
```

Or copy into `.github/skills/rubber-duck` directly if you prefer Copilot’s classic layout.

---

## Pathway D — Use in-place (developers of this repo)

No install. From this checkout:

```bash
node skills/rubber-duck/scripts/bridge.mjs
```

Open `http://127.0.0.1:3847/`. In Agent chat, ask to rubber-duck using the skill already present under `skills/` / `.github/skills/`.

---

## Where files land

| Pathway | Typical location |
|---------|------------------|
| `gh` / installer, Copilot, `--scope user` | `~/.copilot/skills/rubber-duck` |
| `gh` / installer, `--scope project` | `.agents/skills/rubber-duck` (shared by several hosts) |
| Manual Cursor personal | `~/.cursor/skills/rubber-duck` |
| Manual broad discovery | `~/.agents/skills/rubber-duck` |
| This repository (vendored) | `skills/rubber-duck` (+ `.github/skills` symlink) |

---

## Verify

```bash
# if you used gh
gh skill list 2>/dev/null || true

# bridge smoke test (path may vary)
node ~/.copilot/skills/rubber-duck/scripts/bridge.mjs
# or
node skills/rubber-duck/scripts/bridge.mjs
```

Health: `curl -s http://127.0.0.1:3847/health`
