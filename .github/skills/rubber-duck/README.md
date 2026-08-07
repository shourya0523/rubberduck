# rubber-duck skill

Agent skill for rubber-duck debugging sessions. See the repository [README](../../../README.md) for full docs.

## Install into another project

```bash
# from the other project's root
mkdir -p .github/skills
cp -R /path/to/rubberduck/.github/skills/rubber-duck .github/skills/
```

Or personal (all projects):

```bash
cp -R /path/to/rubberduck/.github/skills/rubber-duck ~/.copilot/skills/
cp -R /path/to/rubberduck/.github/skills/rubber-duck ~/.agents/skills/
```

Open that project → new **Agent** chat → “Start a rubber duck session”.

## Invoke manually

```bash
node scripts/bridge.mjs
```

Then open `http://127.0.0.1:3847/`.

## Replace models

Overwrite `assets/duck-base.glb`, `assets/duck-thinking.glb`, and `assets/duck-excited.glb`.
