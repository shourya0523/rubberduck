#!/usr/bin/env node
/**
 * One-shot session setup for the rubber-duck skill.
 *
 *   node setup.mjs              # ensure bridge, open browser, wire MCP
 *   node setup.mjs --no-open    # skip browser
 *   node setup.mjs --no-mcp     # skip MCP config merge
 *
 * Always prints one JSON object on stdout for the agent.
 */

import { setupSession } from "./lib.mjs";

function parseFlags(argv) {
  const flags = { open: true, mcp: true, help: false };
  for (const a of argv) {
    if (a === "--no-open") flags.open = false;
    else if (a === "--no-mcp") flags.mcp = false;
    else if (a === "--help" || a === "-h") flags.help = true;
  }
  return flags;
}

async function main() {
  const flags = parseFlags(process.argv.slice(2));
  if (flags.help) {
    process.stdout.write(`Usage: node setup.mjs [--no-open] [--no-mcp]

Starts the localhost duck bridge if needed, opens the UI in a browser,
and merges the rubber-duck MCP server into Copilot/Cursor configs.
Prints JSON status on stdout.
`);
    return;
  }

  const result = await setupSession({ open: flags.open, mcp: flags.mcp });
  process.stdout.write(JSON.stringify(result, null, 2) + "\n");
}

main().catch((err) => {
  process.stderr.write((err.message || String(err)) + "\n");
  process.stdout.write(
    JSON.stringify({ ok: false, error: err.message || String(err) }) + "\n"
  );
  process.exit(1);
});
