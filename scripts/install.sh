#!/usr/bin/env bash
# Rubber Duck — install into Copilot / Cursor / Claude / other Agent Skills hosts.
# Usage:
#   ./scripts/install.sh                  # interactive-ish defaults: user + github-copilot
#   ./scripts/install.sh --scope user
#   ./scripts/install.sh --scope project
#   ./scripts/install.sh --agent cursor --scope user
#   ./scripts/install.sh --manual         # copy without gh
#   ./scripts/install.sh --from-github    # force remote install via gh
#   ./scripts/install.sh --help

set -euo pipefail

REPO_SLUG="${RUBBERDUCK_REPO:-shourya0523/rubberduck}"
SKILL_NAME="rubber-duck"
SCOPE="user"
AGENT="github-copilot"
MODE="auto"       # auto | gh | manual
FROM="local"      # local | github
PIN="${RUBBERDUCK_PIN:-}"
FORCE=0

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SKILL_SRC="${ROOT}/skills/${SKILL_NAME}"

usage() {
  cat <<'EOF'
Rubber Duck skill installer

Options:
  --scope user|project   Install for all repos (user) or current repo (project)
  --agent NAME           github-copilot | cursor | claude-code | codex | ...
  --from-github          Install from GitHub via gh skill (default if no local skill/)
  --from-local           Install from this checkout (default when skill/ exists)
  --manual               Copy files directly (no gh CLI)
  --pin REF              Pin gh install to branch/tag/SHA
  --force                Overwrite existing install
  -h, --help             Show help

Examples:
  ./scripts/install.sh --scope user
  ./scripts/install.sh --scope project --agent cursor
  ./scripts/install.sh --from-github --scope user --pin main
  ./scripts/install.sh --manual --scope user
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --scope) SCOPE="${2:?}"; shift 2 ;;
    --agent) AGENT="${2:?}"; shift 2 ;;
    --from-github) FROM="github"; shift ;;
    --from-local) FROM="local"; shift ;;
    --manual) MODE="manual"; shift ;;
    --pin) PIN="${2:?}"; shift 2 ;;
    --force|-f) FORCE=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown option: $1" >&2; usage; exit 1 ;;
  esac
done

if [[ ! -d "$SKILL_SRC" || ! -f "$SKILL_SRC/SKILL.md" ]]; then
  if [[ "$FROM" == "local" && "$MODE" != "gh" ]]; then
    echo "Local skill not found at $SKILL_SRC — switching to --from-github" >&2
    FROM="github"
  fi
fi

need_node() {
  if ! command -v node >/dev/null 2>&1; then
    echo "Warning: Node.js not found. The duck bridge needs Node to run." >&2
  else
    echo "Node: $(node -v)"
  fi
}

dest_for_manual() {
  local agent="$1" scope="$2"
  if [[ "$scope" == "project" ]]; then
    case "$agent" in
      github-copilot|cursor|codex|gemini-cli|amp|warp|cline|opencode)
        echo "$(pwd)/.agents/skills/${SKILL_NAME}" ;;
      claude-code)
        echo "$(pwd)/.claude/skills/${SKILL_NAME}" ;;
      *)
        echo "$(pwd)/.agents/skills/${SKILL_NAME}" ;;
    esac
  else
    case "$agent" in
      github-copilot) echo "${HOME}/.copilot/skills/${SKILL_NAME}" ;;
      cursor) echo "${HOME}/.cursor/skills/${SKILL_NAME}" ;;
      claude-code) echo "${HOME}/.claude/skills/${SKILL_NAME}" ;;
      codex) echo "${HOME}/.codex/skills/${SKILL_NAME}" ;;
      *) echo "${HOME}/.agents/skills/${SKILL_NAME}" ;;
    esac
  fi
}

manual_install() {
  local dest
  dest="$(dest_for_manual "$AGENT" "$SCOPE")"
  if [[ "$FROM" == "github" ]]; then
    echo "Manual mode needs a local checkout. Clone first, then re-run with --from-local." >&2
    exit 1
  fi
  if [[ -e "$dest" && "$FORCE" -ne 1 ]]; then
    echo "Already exists: $dest (pass --force to overwrite)" >&2
    exit 1
  fi
  mkdir -p "$(dirname "$dest")"
  rm -rf "$dest"
  mkdir -p "$dest"
  # portable copy (no rsync required)
  tar -C "$SKILL_SRC" -cf - . | tar -C "$dest" -xf -
  echo "Installed (manual) → $dest"
  echo "Also mirroring to ~/.agents/skills for broad discovery…"
  local mirror="${HOME}/.agents/skills/${SKILL_NAME}"
  mkdir -p "$(dirname "$mirror")"
  rm -rf "$mirror"
  mkdir -p "$mirror"
  tar -C "$SKILL_SRC" -cf - . | tar -C "$mirror" -xf -
  echo "Mirrored → $mirror"
}

gh_install() {
  if ! command -v gh >/dev/null 2>&1; then
    echo "gh not found — falling back to manual copy." >&2
    MODE="manual"
    manual_install
    return
  fi

  local ver
  ver="$(gh --version 2>/dev/null | head -n1 || true)"
  echo "Using $ver"

  local args=(skill install)
  local force_args=()
  [[ "$FORCE" -eq 1 ]] && force_args+=(--force)

  if [[ "$FROM" == "local" ]]; then
    args+=("$ROOT" "$SKILL_NAME" --from-local --agent "$AGENT" --scope "$SCOPE")
  else
    args+=("$REPO_SLUG" "$SKILL_NAME" --agent "$AGENT" --scope "$SCOPE")
    if [[ -n "$PIN" ]]; then
      args+=(--pin "$PIN")
    fi
  fi
  args+=("${force_args[@]}")

  echo "+ gh ${args[*]}"
  gh "${args[@]}"
}

echo "Rubber Duck install"
echo "  scope=$SCOPE  agent=$AGENT  from=$FROM  mode=$MODE"
need_node

if [[ "$MODE" == "manual" ]]; then
  manual_install
else
  gh_install
fi

cat <<EOF

Next:
  1. Reload your IDE / start a new Agent chat
  2. Say: Start a rubber duck session
  3. Open the printed URL (http://127.0.0.1:3847/) in Chrome or Edge

Docs: ${ROOT}/docs/INSTALL.md
EOF
