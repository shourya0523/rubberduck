# rubber-duck skill

Voice-first rubber-duck debugging for GitHub Copilot and other coding agents.

## Install pathways

- Humans: **[docs/INSTALL.md](../../docs/INSTALL.md)**
- LLMs / coding agents: **[docs/INSTALL-FOR-LLMS.md](../../docs/INSTALL-FOR-LLMS.md)**

```bash
# A — gh CLI (personal) — requires gh >= 2.90
gh skill install shourya0523/rubberduck rubber-duck --scope user --pin v0.1.0

# B — installer from this repo
../../scripts/install.sh --scope user
../../scripts/install.sh --manual --scope user

# C — manual copy
cp -R . ~/.copilot/skills/rubber-duck
cp -R . ~/.agents/skills/rubber-duck
```

Requires Node.js. Prefer Chrome/Edge for the mic.

Then: Agent chat → **Start a rubber duck session**.

## Manual bridge

```bash
node scripts/bridge.mjs
```

Open `http://127.0.0.1:3847/`.

## Replace duck animation

Overwrite `assets/source/duck-anim.webp`, then:

```bash
pip install Pillow
node scripts/split-duck-webps.mjs
```
