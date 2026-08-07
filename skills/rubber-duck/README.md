# rubber-duck skill

Voice-first rubber-duck debugging for GitHub Copilot and other coding agents.

## Install

```bash
# all projects (personal / user scope)
gh skill install shourya0523/rubberduck rubber-duck --scope user

# current repo only
gh skill install shourya0523/rubberduck rubber-duck
```

Requires [GitHub CLI](https://cli.github.com/) 2.90+ and Node.js.

Then open any project → Copilot **Agent** chat → **Start a rubber duck session**.

## Manual

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
