/**
 * Shared helpers for bridge CLI, setup, and MCP (zero-dep).
 */

import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const SKILL_ROOT = path.resolve(__dirname, "..");
export const BRIDGE_PATH = path.join(__dirname, "bridge.mjs");
export const MCP_PATH = path.join(__dirname, "mcp.mjs");
export const HOST = process.env.RUBBERDUCK_HOST || "127.0.0.1";
export const PORT = Number(process.env.RUBBERDUCK_PORT || 3847);
export const BASE = `http://${HOST}:${PORT}`;
export const DEFAULT_WAIT_MS = Number(process.env.RUBBERDUCK_WAIT_MS || 3000);

export function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function fetchJson(pathname, options = {}) {
  const res = await fetch(`${BASE}${pathname}`, options);
  if (res.status === 204) return { status: 204, ok: true, data: null };
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  return { status: res.status, ok: res.ok, data };
}

export async function bridgeHealth() {
  try {
    const { ok, data } = await fetchJson("/health");
    return ok ? data : null;
  } catch {
    return null;
  }
}

/** @type {import('node:child_process').ChildProcess | null} */
let bridgeChild = null;

/**
 * Start the HTTP bridge in the background if it is not already healthy.
 */
export async function ensureBridge() {
  const health = await bridgeHealth();
  if (health?.ok) {
    return { started: false, url: `${BASE}/`, health, pid: null };
  }

  if (bridgeChild && !bridgeChild.killed) {
    for (let i = 0; i < 25; i++) {
      await sleep(100);
      const h = await bridgeHealth();
      if (h?.ok) {
        return { started: true, url: `${BASE}/`, health: h, pid: bridgeChild.pid };
      }
    }
  }

  const logPath = path.join(os.tmpdir(), `rubberduck-bridge-${PORT}.log`);
  const logFd = fs.openSync(logPath, "a");
  bridgeChild = spawn(process.execPath, [BRIDGE_PATH, "serve"], {
    detached: true,
    stdio: ["ignore", logFd, logFd],
    env: {
      ...process.env,
      RUBBERDUCK_HOST: HOST,
      RUBBERDUCK_PORT: String(PORT),
    },
  });
  bridgeChild.unref();
  try {
    fs.closeSync(logFd);
  } catch {
    /* ignore */
  }

  for (let i = 0; i < 50; i++) {
    await sleep(100);
    const h = await bridgeHealth();
    if (h?.ok) {
      return {
        started: true,
        url: `${BASE}/`,
        health: h,
        pid: bridgeChild.pid,
        log: logPath,
      };
    }
  }

  throw new Error(
    `Could not start bridge at ${BASE}/. Check log: ${logPath}. Or run: node ${BRIDGE_PATH}`
  );
}

export async function postStream(type, text = "") {
  const { ok, status, data } = await fetchJson("/stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, text }),
  });
  if (!ok) throw new Error(data?.error || `HTTP ${status}`);
  return data;
}

/**
 * Best-effort open the duck UI in a local browser.
 * @returns {{ opened: boolean, method: string|null, error?: string }}
 */
export function openBrowser(url) {
  if (process.env.RUBBERDUCK_NO_OPEN === "1") {
    return { opened: false, method: null, error: "RUBBERDUCK_NO_OPEN=1" };
  }

  const platform = process.platform;
  let cmd;
  let args;
  if (platform === "darwin") {
    cmd = "open";
    args = [url];
  } else if (platform === "win32") {
    cmd = "cmd";
    args = ["/c", "start", "", url];
  } else {
    cmd = "xdg-open";
    args = [url];
  }

  try {
    const child = spawn(cmd, args, {
      detached: true,
      stdio: "ignore",
    });
    child.unref();
    return { opened: true, method: cmd };
  } catch (err) {
    return { opened: false, method: cmd, error: err.message || String(err) };
  }
}

function readJsonFile(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function writeJsonFile(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
}

/**
 * Merge rubber-duck MCP server into a host config file.
 * @returns {{ path: string, status: 'created'|'updated'|'unchanged'|'skipped', reason?: string }}
 */
export function installMcpInto(filePath, { type } = {}) {
  const absMcp = path.resolve(MCP_PATH);
  const entry = {
    command: "node",
    args: [absMcp],
  };
  if (type) {
    entry.type = type;
    entry.tools = ["*"];
  }

  let doc = readJsonFile(filePath);
  if (doc == null && fs.existsSync(filePath)) {
    return {
      path: filePath,
      status: "skipped",
      reason: "existing file is not valid JSON",
    };
  }
  if (doc == null) doc = {};

  if (!doc.mcpServers || typeof doc.mcpServers !== "object") {
    doc.mcpServers = {};
  }

  const prev = doc.mcpServers["rubber-duck"];
  const same =
    prev &&
    prev.command === entry.command &&
    Array.isArray(prev.args) &&
    prev.args[0] === absMcp;

  if (same) {
    return { path: filePath, status: "unchanged" };
  }

  doc.mcpServers["rubber-duck"] = { ...prev, ...entry };
  // Keep tools allowlist for Copilot-style configs
  if (type && !doc.mcpServers["rubber-duck"].tools) {
    doc.mcpServers["rubber-duck"].tools = ["*"];
  }

  const existed = fs.existsSync(filePath);
  writeJsonFile(filePath, doc);
  return { path: filePath, status: existed ? "updated" : "created" };
}

/**
 * Wire MCP into common local agent hosts (best-effort, non-destructive merge).
 */
export function installMcpConfigs() {
  const home = os.homedir();
  const targets = [
    { path: path.join(home, ".copilot", "mcp-config.json"), type: "local" },
    { path: path.join(home, ".cursor", "mcp.json"), type: null },
    { path: path.join(home, ".claude", "mcp.json"), type: null },
    { path: path.join(home, ".codex", "mcp.json"), type: null },
  ];

  // Only create Copilot + Cursor by default; others only if parent dir exists
  const results = [];
  for (const t of targets) {
    const parent = path.dirname(t.path);
    const isPrimary =
      t.path.includes(`${path.sep}.copilot${path.sep}`) ||
      t.path.includes(`${path.sep}.cursor${path.sep}`);
    if (!isPrimary && !fs.existsSync(parent)) {
      results.push({
        path: t.path,
        status: "skipped",
        reason: "host config directory not present",
      });
      continue;
    }
    results.push(installMcpInto(t.path, { type: t.type }));
  }
  return results;
}

/**
 * Full session bootstrap for agents: bridge + browser + MCP wiring.
 */
export async function setupSession({ open = true, mcp = true } = {}) {
  const bridge = await ensureBridge();
  const browser = open
    ? openBrowser(bridge.url)
    : { opened: false, method: null, error: "skipped" };
  const mcpInstall = mcp ? installMcpConfigs() : [];

  return {
    ok: true,
    skillRoot: SKILL_ROOT,
    url: bridge.url,
    bridge: {
      started: bridge.started,
      health: bridge.health,
      pid: bridge.pid,
      log: bridge.log || null,
    },
    browser,
    mcp: mcpInstall,
    next: [
      "Tell the user the duck UI is open (or give them the url if browser.opened is false).",
      "Prefer MCP tools duck_wait / duck_say / duck_token / duck_done if available after reload.",
      "Otherwise use: node scripts/bridge.mjs wait|say|token|done (short-poll; never --block by default).",
    ],
  };
}
