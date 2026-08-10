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

Then: Agent chat → **Start a rubber duck session**. The skill runs **`node scripts/setup.mjs`** once — starts bridge, opens UI, wires MCP. No manual server/MCP steps.

## Manual setup (optional)

```bash
node scripts/setup.mjs
# or
node scripts/bridge.mjs setup
```

## Duck

Duck OS UI: bundled CSS pixel-art duck with base, thinking, excited, and listening reactions. Pixel speech bubbles add character without replacing session status or response text.