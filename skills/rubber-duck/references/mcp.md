# Rubber Duck MCP setup

Zero-dep stdio server: `scripts/mcp.mjs`. Talks to the local HTTP bridge on `127.0.0.1:3847`.

## Tools

| Tool | Purpose |
|------|---------|
| `duck_ensure` | Start bridge if needed; return URL |
| `duck_health` | Bridge health JSON |
| `duck_wait` | Short-poll utterance or `{pending:true}` |
| `duck_say` | State: `base` \| `thinking` \| `excited` |
| `duck_token` | Stream one reply chunk |
| `duck_done` | End turn (optional state) |

## Copilot CLI (`~/.copilot/mcp-config.json`)

```json
{
  "mcpServers": {
    "rubber-duck": {
      "type": "local",
      "command": "node",
      "args": [
        "/ABSOLUTE/PATH/TO/rubber-duck/scripts/mcp.mjs"
      ],
      "tools": ["*"]
    }
  }
}
```

After `gh skill install … --scope user`, the path is typically:

`~/.copilot/skills/rubber-duck/scripts/mcp.mjs`

Reload Copilot / restart the CLI so MCP connects.

## Cursor (`~/.cursor/mcp.json` or project `.cursor/mcp.json`)

```json
{
  "mcpServers": {
    "rubber-duck": {
      "command": "node",
      "args": [
        "/ABSOLUTE/PATH/TO/rubber-duck/scripts/mcp.mjs"
      ]
    }
  }
}
```

## Claude Desktop / Claude Code

Same stdio pattern: `command` = `node`, `args` = absolute path to `mcp.mjs`.

## Same-host rule

MCP tools hit localhost. The IDE agent and the browser must run on the **same machine** as the bridge. Remote/cloud agents need an explicit tunnel; do not pretend `/pending` works across the network by default.

## Manual smoke test

```bash
# Terminal A — optional; duck_ensure can spawn the bridge
node scripts/bridge.mjs

# Terminal B — fake one MCP initialize + tools/list
printf '%s\n' \
  '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"t","version":"0"}}}' \
  '{"jsonrpc":"2.0","method":"notifications/initialized"}' \
  '{"jsonrpc":"2.0","id":2,"method":"tools/list"}' \
  | node scripts/mcp.mjs
```
