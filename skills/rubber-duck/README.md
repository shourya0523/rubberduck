# rubber-duck skill

Voice-first rubber-duck debugging for GitHub Copilot and other coding agents.

## Install pathways

See **[docs/INSTALL.md](../../docs/INSTALL.md)** for the full matrix.

```bash
# A — gh CLI (personal)
gh skill install shourya0523/rubberduck rubber-duck --scope user

# B — installer from this repo
../../scripts/install.sh --scope user
../../scripts/install.sh --scope user --agent cursor
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

## Duck

WebP state loops in `assets/` (`duck-base|thinking|excited.webp` + posters). The UI uses an atmospheric material background (warm light pool over graphite) so translucent chrome stays clear — no photo backdrop.