# Rubber Duck MCP

Usually you do **not** edit this by hand. From the skill directory:

```bash
node scripts/setup.mjs
```

That merges `scripts/mcp.mjs` into:

- `~/.copilot/mcp-config.json` (Copilot)
- `~/.cursor/mcp.json` (Cursor)
- `~/.claude/mcp.json` / `~/.codex/mcp.json` if those dirs already exist

Reload the IDE / Copilot CLI once so MCP connects. After that, prefer tools: `duck_setup`, `duck_wait`, `duck_say`, `duck_token`, `duck_done`.

## Manual entry (only if setup cannot write)

```json
{
  "mcpServers": {
    "rubber-duck": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/TO/rubber-duck/scripts/mcp.mjs"]
    }
  }
}
```

Copilot may also want `"type": "local"` and `"tools": ["*"]` — setup adds those for `~/.copilot/mcp-config.json`.

## Same-host rule

MCP talks to localhost. Agent + browser + bridge must share one machine.
