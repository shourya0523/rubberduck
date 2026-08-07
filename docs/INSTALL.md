# Install Rubber Duck

Official tooling: [`gh skill`](https://cli.github.com/manual/gh_skill) (GitHub CLI **2.90+**) and the [Agent Skills](https://agentskills.io/specification) layout (`skills/*/SKILL.md`).

Requires **Node.js** (`node -v`) for the duck bridge. Prefer Chrome/Edge for the mic.

After install: reload the IDE → **Agent** chat → **Start a rubber duck session**.

---

## Recommended — GitHub CLI

### Search / preview (safe first)

```bash
gh skill search rubber-duck
gh skill preview shourya0523/rubberduck rubber-duck
```

### Install (personal — every project)

```bash
gh skill install shourya0523/rubberduck rubber-duck --scope user
```

### Install (this project only)

```bash
gh skill install shourya0523/rubberduck rubber-duck --scope project
```

Default without `--scope` is **project**. Prefer `--scope user` for “works in any repo.”

### Other agent hosts

```bash
gh skill install shourya0523/rubberduck rubber-duck --scope user --agent cursor
gh skill install shourya0523/rubberduck rubber-duck --scope user --agent claude-code
gh skill install shourya0523/rubberduck rubber-duck --scope user --agent codex
```

### Pin a release / commit

```bash
gh skill install shourya0523/rubberduck rubber-duck --scope user --pin v0.1.0
# or
gh skill install shourya0523/rubberduck rubber-duck@v0.1.0 --scope user
```

### From a local clone

```bash
git clone https://github.com/shourya0523/rubberduck.git
cd rubberduck
gh skill install . rubber-duck --from-local --scope user
```

### Update

```bash
gh skill update rubber-duck
gh skill update --all
```

---

## Installer script (this repo)

```bash
./scripts/install.sh --scope user
./scripts/install.sh --scope user --agent cursor
./scripts/install.sh --manual --scope user          # no gh
./scripts/install.sh --from-github --scope user
```

---

## Manual copy (no `gh`)

```bash
git clone https://github.com/shourya0523/rubberduck.git /tmp/rubberduck
mkdir -p ~/.copilot/skills ~/.agents/skills
cp -R /tmp/rubberduck/skills/rubber-duck ~/.copilot/skills/
cp -R /tmp/rubberduck/skills/rubber-duck ~/.agents/skills/
```

Into another project:

```bash
mkdir -p .agents/skills
cp -R /path/to/rubberduck/skills/rubber-duck .agents/skills/
```

---

## In-place (this checkout)

```bash
node skills/rubber-duck/scripts/bridge.mjs
```

Skill is already at `skills/rubber-duck/` (and `.github/skills/rubber-duck` for Copilot project discovery).

---

## Where installs land

| Scope / host | Location |
|--------------|----------|
| Copilot, `--scope user` | `~/.copilot/skills/rubber-duck` |
| Several hosts, `--scope project` | `.agents/skills/rubber-duck` |
| Cursor personal | `~/.cursor/skills/…` (via `--agent cursor`) |
| Manual broad discovery | `~/.agents/skills/rubber-duck` |

Do **not** commit `.agents/skills` or `.claude/skills` install dumps into a skills *source* repo — those folders are destinations for `gh skill install`. This repo publishes from `skills/rubber-duck/` only.

---

## Maintainers — publish for install

Layout required by `gh skill`:

```text
skills/rubber-duck/SKILL.md   # name must match directory
```

Validate, then cut a release:

```bash
gh skill publish --dry-run
gh skill publish --tag v0.1.0
```

`gh skill publish` validates against [agentskills.io](https://agentskills.io/specification), can add the `agent-skills` topic, and creates a GitHub release so users can `--pin v0.1.0`.
