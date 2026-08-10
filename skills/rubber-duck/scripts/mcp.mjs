#!/usr/bin/env node
/**
 * Rubber Duck MCP server (stdio, zero-dep).
 * Exposes short-poll wait + stream tools over Model Context Protocol so
 * Copilot / Cursor / Claude can drive the local duck bridge without hanging
 * a shell on a 60s wait.
 *
 * Configure (example Copilot / Cursor mcp.json):
 *   {
 *     "mcpServers": {
 *       "rubber-duck": {
 *         "command": "node",
 *         "args": ["/absolute/path/to/skills/rubber-duck/scripts/mcp.mjs"],
 *         "tools": ["*"]
 *       }
 *     }
 *   }
 *
 * Start the HTTP bridge first (or call duck_ensure). Browser must share
 * the same host as this process (localhost).
 */

import { spawn } from "node:child_process";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BRIDGE_PATH = path.join(__dirname, "bridge.mjs");
const HOST = process.env.RUBBERDUCK_HOST || "127.0.0.1";
const PORT = Number(process.env.RUBBERDUCK_PORT || 3847);
const BASE = `http://${HOST}:${PORT}`;
const DEFAULT_WAIT_MS = Number(process.env.RUBBERDUCK_WAIT_MS || 3000);
const PROTOCOL_VERSION = "2025-03-26";
const SERVER_INFO = { name: "rubber-duck", version: "0.4.0" };

const STATES = new Set(["base", "thinking", "excited"]);

/** @type {import('node:child_process').ChildProcess | null} */
let bridgeChild = null;

function log(...args) {
  console.error("[rubber-duck-mcp]", ...args);
}

function send(msg) {
  process.stdout.write(JSON.stringify(msg) + "\n");
}

function okText(obj) {
  const text = typeof obj === "string" ? obj : JSON.stringify(obj);
  return { content: [{ type: "text", text }] };
}

function errText(message) {
  return {
    content: [{ type: "text", text: message }],
    isError: true,
  };
}

async function fetchJson(pathname, options = {}) {
  const res = await fetch(`${BASE}${pathname}`, options);
  if (res.status === 204) return { status: 204, data: null };
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  return { status: res.status, ok: res.ok, data };
}

async function bridgeHealth() {
  try {
    const { ok, data } = await fetchJson("/health");
    return ok ? data : null;
  } catch {
    return null;
  }
}

async function ensureBridge() {
  const health = await bridgeHealth();
  if (health?.ok) {
    return { started: false, url: `${BASE}/`, health };
  }

  if (bridgeChild && !bridgeChild.killed) {
    for (let i = 0; i < 20; i++) {
      await sleep(100);
      const h = await bridgeHealth();
      if (h?.ok) return { started: true, url: `${BASE}/`, health: h };
    }
  }

  bridgeChild = spawn(process.execPath, [BRIDGE_PATH, "serve"], {
    detached: true,
    stdio: "ignore",
    env: { ...process.env, RUBBERDUCK_HOST: HOST, RUBBERDUCK_PORT: String(PORT) },
  });
  bridgeChild.unref();

  for (let i = 0; i < 40; i++) {
    await sleep(100);
    const h = await bridgeHealth();
    if (h?.ok) return { started: true, url: `${BASE}/`, health: h };
  }

  throw new Error(
    `Could not start bridge at ${BASE}/. Run: node ${BRIDGE_PATH}`
  );
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function postStream(type, text = "") {
  const { ok, status, data } = await fetchJson("/stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, text }),
  });
  if (!ok) {
    throw new Error(data?.error || `HTTP ${status}`);
  }
  return data;
}

const TOOLS = [
  {
    name: "duck_ensure",
    description:
      "Ensure the local rubber-duck HTTP bridge is running and return its URL. Call once at session start; open the URL in the user's browser.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "duck_health",
    description: "Check rubber-duck bridge health (clients, queued utterances).",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "duck_wait",
    description:
      "Short-poll for the next human utterance from the duck UI. Returns JSON with id/text/ts, or {pending:true} if none yet. Call again when pending — never long-block.",
    inputSchema: {
      type: "object",
      properties: {
        ms: {
          type: "number",
          description: `Poll window in milliseconds (default ${DEFAULT_WAIT_MS}, max 120000). Keep short for agent harnesses.`,
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: "duck_say",
    description: "Set duck pose/state: base | thinking | excited.",
    inputSchema: {
      type: "object",
      properties: {
        state: {
          type: "string",
          enum: ["base", "thinking", "excited"],
          description: "Duck visual state",
        },
      },
      required: ["state"],
      additionalProperties: false,
    },
  },
  {
    name: "duck_token",
    description:
      "Stream one phrase/sentence of the duck's reply to the browser UI.",
    inputSchema: {
      type: "object",
      properties: {
        text: { type: "string", description: "Chunk of spoken-friendly reply text" },
      },
      required: ["text"],
      additionalProperties: false,
    },
  },
  {
    name: "duck_done",
    description:
      "Finish the current reply turn (unlocks mic). Optional end state.",
    inputSchema: {
      type: "object",
      properties: {
        state: {
          type: "string",
          enum: ["base", "thinking", "excited"],
          description: "Optional pose after the turn (excited on insight)",
        },
      },
      additionalProperties: false,
    },
  },
];

async function callTool(name, args = {}) {
  switch (name) {
    case "duck_ensure": {
      const result = await ensureBridge();
      return okText(result);
    }
    case "duck_health": {
      const health = await bridgeHealth();
      if (!health) {
        return errText(
          `Bridge not reachable at ${BASE}/. Call duck_ensure or run: node ${BRIDGE_PATH}`
        );
      }
      return okText(health);
    }
    case "duck_wait": {
      await ensureBridge();
      let ms = args.ms != null ? Number(args.ms) : DEFAULT_WAIT_MS;
      if (!Number.isFinite(ms) || ms < 0) ms = DEFAULT_WAIT_MS;
      ms = Math.min(ms, 120000);
      const { status, data } = await fetchJson(`/pending?wait=${ms}`);
      if (status === 204) return okText({ pending: true, waitMs: ms });
      if (!data) return errText("Unexpected empty response from /pending");
      return okText(data);
    }
    case "duck_say": {
      const state = String(args.state || "");
      if (!STATES.has(state)) {
        return errText("state must be one of: base, thinking, excited");
      }
      await ensureBridge();
      await postStream("state", state);
      return okText({ ok: true, state });
    }
    case "duck_token": {
      const text = String(args.text ?? "");
      if (!text) return errText("text is required");
      await ensureBridge();
      await postStream("token", text);
      return okText({ ok: true });
    }
    case "duck_done": {
      const state = args.state != null ? String(args.state) : "";
      if (state && !STATES.has(state)) {
        return errText("state must be one of: base, thinking, excited");
      }
      await ensureBridge();
      await postStream("done", state);
      return okText({ ok: true, state: state || null });
    }
    default:
      return errText(`Unknown tool: ${name}`);
  }
}

async function handleRequest(msg) {
  const { id, method, params } = msg;

  if (method === "initialize") {
    send({
      jsonrpc: "2.0",
      id,
      result: {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: { tools: {} },
        serverInfo: SERVER_INFO,
        instructions:
          "Rubber duck debugging over a local browser UI. Call duck_ensure, open the URL for the user, then loop: duck_wait (retry while pending) → duck_say thinking → reason about the repo → duck_token chunks → duck_done. Agent and browser must share localhost.",
      },
    });
    return;
  }

  if (method === "ping") {
    send({ jsonrpc: "2.0", id, result: {} });
    return;
  }

  if (method === "tools/list") {
    send({ jsonrpc: "2.0", id, result: { tools: TOOLS } });
    return;
  }

  if (method === "tools/call") {
    const name = params?.name;
    const args = params?.arguments || {};
    try {
      const result = await callTool(name, args);
      send({ jsonrpc: "2.0", id, result });
    } catch (err) {
      send({
        jsonrpc: "2.0",
        id,
        result: errText(err.message || String(err)),
      });
    }
    return;
  }

  if (method === "resources/list") {
    send({ jsonrpc: "2.0", id, result: { resources: [] } });
    return;
  }

  if (method === "prompts/list") {
    send({ jsonrpc: "2.0", id, result: { prompts: [] } });
    return;
  }

  send({
    jsonrpc: "2.0",
    id,
    error: { code: -32601, message: `Method not found: ${method}` },
  });
}

let inflight = 0;
let stdinClosed = false;

function maybeExit() {
  if (stdinClosed && inflight === 0) process.exit(0);
}

function handleMessage(msg) {
  if (!msg || typeof msg !== "object") return;

  // Notifications — no response
  if (msg.method && msg.id === undefined) {
    if (msg.method === "notifications/initialized") return;
    if (msg.method === "notifications/cancelled") return;
    return;
  }

  if (msg.method && msg.id !== undefined) {
    inflight += 1;
    handleRequest(msg)
      .catch((err) => {
        log("request error", err);
        send({
          jsonrpc: "2.0",
          id: msg.id,
          error: { code: -32603, message: err.message || String(err) },
        });
      })
      .finally(() => {
        inflight -= 1;
        maybeExit();
      });
  }
}

function main() {
  log(`stdio MCP ready; bridge target ${BASE}/`);
  const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
  rl.on("line", (line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    let msg;
    try {
      msg = JSON.parse(trimmed);
    } catch (err) {
      log("invalid JSON on stdin", err.message);
      return;
    }
    if (Array.isArray(msg)) {
      for (const m of msg) handleMessage(m);
    } else {
      handleMessage(msg);
    }
  });
  rl.on("close", () => {
    stdinClosed = true;
    maybeExit();
  });
}

main();
