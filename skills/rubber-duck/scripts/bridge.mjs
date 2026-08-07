#!/usr/bin/env node
/**
 * Rubber Duck local bridge — zero-dep Node HTTP + SSE.
 * Serves the duck UI and relays utterances / streamed replies between
 * the browser and the coding agent.
 *
 * Usage:
 *   node bridge.mjs                 # start server
 *   node bridge.mjs wait            # block for next utterance (JSON)
 *   node bridge.mjs say --state X   # set duck state
 *   node bridge.mjs token "text"    # stream a token chunk
 *   node bridge.mjs done [--state X]
 *   node bridge.mjs health
 */

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SKILL_ROOT = path.resolve(__dirname, "..");
const APP_DIR = path.join(SKILL_ROOT, "app");
const ASSETS_DIR = path.join(SKILL_ROOT, "assets");

const HOST = process.env.RUBBERDUCK_HOST || "127.0.0.1";
const PORT = Number(process.env.RUBBERDUCK_PORT || 3847);
const BASE = `http://${HOST}:${PORT}`;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".glb": "model/gltf-binary",
  ".gltf": "model/gltf+json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".wasm": "application/wasm",
  ".map": "application/json",
};

/** @type {Set<http.ServerResponse>} */
const sseClients = new Set();
/** @type {Array<{id:string,text:string,ts:number}>} */
const utteranceQueue = [];
/** @type {Array<(u: object|null) => void>} */
const pendingWaiters = [];

function json(res, status, body) {
  const data = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*",
  });
  res.end(data);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

function broadcast(event) {
  const payload = `data: ${JSON.stringify(event)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch {
      sseClients.delete(client);
    }
  }
}

function enqueueUtterance(text) {
  const trimmed = String(text || "").trim();
  if (!trimmed) return null;
  const item = { id: randomUUID(), text: trimmed, ts: Date.now() };
  if (pendingWaiters.length > 0) {
    const resolve = pendingWaiters.shift();
    resolve(item);
  } else {
    utteranceQueue.push(item);
  }
  return item;
}

function waitForUtterance(timeoutMs) {
  if (utteranceQueue.length > 0) {
    return Promise.resolve(utteranceQueue.shift());
  }
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      const idx = pendingWaiters.indexOf(wrapper);
      if (idx >= 0) pendingWaiters.splice(idx, 1);
      resolve(value);
    };
    const wrapper = (u) => finish(u);
    pendingWaiters.push(wrapper);
    if (timeoutMs > 0) {
      setTimeout(() => finish(null), timeoutMs);
    }
  });
}

function safeJoin(root, rel) {
  const resolved = path.resolve(root, rel);
  if (!resolved.startsWith(root + path.sep) && resolved !== root) {
    return null;
  }
  return resolved;
}

function serveFile(res, filePath) {
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    json(res, 404, { error: "not found" });
    return;
  }
  const ext = path.extname(filePath).toLowerCase();
  const type = MIME[ext] || "application/octet-stream";
  res.writeHead(200, {
    "Content-Type": type,
    "Cache-Control": ext === ".html" ? "no-store" : "public, max-age=3600",
    "Access-Control-Allow-Origin": "*",
  });
  fs.createReadStream(filePath).pipe(res);
}

async function handleApi(req, res, url) {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    res.end();
    return true;
  }

  if (url.pathname === "/health") {
    json(res, 200, {
      ok: true,
      clients: sseClients.size,
      queued: utteranceQueue.length,
      waiters: pendingWaiters.length,
    });
    return true;
  }

  if (url.pathname === "/events" && req.method === "GET") {
    res.writeHead(200, {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-store",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
    });
    res.write(`data: ${JSON.stringify({ type: "hello", text: "connected" })}\n\n`);
    sseClients.add(res);
    req.on("close", () => sseClients.delete(res));
    return true;
  }

  if (url.pathname === "/utterance" && req.method === "POST") {
    try {
      const body = await readBody(req);
      const item = enqueueUtterance(body.text);
      if (!item) {
        json(res, 400, { error: "text required" });
        return true;
      }
      broadcast({ type: "utterance_ack", text: item.id });
      json(res, 200, item);
    } catch (err) {
      json(res, 400, { error: err.message });
    }
    return true;
  }

  if (url.pathname === "/pending" && req.method === "GET") {
    const waitMs = Math.min(
      Math.max(Number(url.searchParams.get("wait") || 25000), 0),
      120000
    );
    const item = await waitForUtterance(waitMs);
    if (!item) {
      res.writeHead(204, {
        "Cache-Control": "no-store",
        "Access-Control-Allow-Origin": "*",
      });
      res.end();
      return true;
    }
    json(res, 200, item);
    return true;
  }

  if (url.pathname === "/stream" && req.method === "POST") {
    try {
      const body = await readBody(req);
      const type = body.type || "token";
      const text = body.text ?? "";
      if (!["token", "state", "done", "error", "diagram", "speak", "hello"].includes(type)) {
        json(res, 400, { error: "unknown type" });
        return true;
      }
      // done may carry end-state in text
      if (type === "done" && text && ["base", "thinking", "excited"].includes(text)) {
        broadcast({ type: "state", text });
      }
      broadcast({ type, text });
      json(res, 200, { ok: true });
    } catch (err) {
      json(res, 400, { error: err.message });
    }
    return true;
  }

  return false;
}

function createServer() {
  return http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url || "/", BASE);

      if (await handleApi(req, res, url)) return;

      if (req.method !== "GET" && req.method !== "HEAD") {
        json(res, 405, { error: "method not allowed" });
        return;
      }

      if (url.pathname === "/" || url.pathname === "/index.html") {
        serveFile(res, path.join(APP_DIR, "index.html"));
        return;
      }

      if (url.pathname.startsWith("/assets/")) {
        const rel = url.pathname.slice("/assets/".length);
        const filePath = safeJoin(ASSETS_DIR, rel);
        if (!filePath) {
          json(res, 403, { error: "forbidden" });
          return;
        }
        serveFile(res, filePath);
        return;
      }

      json(res, 404, { error: "not found" });
    } catch (err) {
      json(res, 500, { error: err.message || "server error" });
    }
  });
}

async function postJson(pathname, body) {
  const res = await fetch(`${BASE}${pathname}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return data;
}

async function cliWait() {
  const waitMs = Number(process.env.RUBBERDUCK_WAIT_MS || 60000);
  const res = await fetch(`${BASE}/pending?wait=${waitMs}`);
  if (res.status === 204) {
    console.error("timeout: no utterance");
    process.exit(2);
  }
  const data = await res.json();
  process.stdout.write(JSON.stringify(data) + "\n");
}

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--state" || a === "-s") {
      args.state = argv[++i];
    } else if (a.startsWith("--")) {
      args[a.slice(2)] = argv[++i] ?? true;
    } else {
      args._.push(a);
    }
  }
  return args;
}

async function runCli(argv) {
  const args = parseArgs(argv);
  const cmd = args._[0] || "serve";

  if (cmd === "serve" || cmd === "start") {
    startServer();
    return;
  }

  if (cmd === "health") {
    const res = await fetch(`${BASE}/health`);
    const data = await res.json();
    process.stdout.write(JSON.stringify(data, null, 2) + "\n");
    process.exit(res.ok ? 0 : 1);
  }

  if (cmd === "wait") {
    await cliWait();
    return;
  }

  if (cmd === "say") {
    const state = args.state || args._[1] || "base";
    await postJson("/stream", { type: "state", text: state });
    process.stdout.write(JSON.stringify({ ok: true, state }) + "\n");
    return;
  }

  if (cmd === "token") {
    const text = args._.slice(1).join(" ");
    if (!text) {
      console.error("usage: bridge.mjs token \"text\"");
      process.exit(1);
    }
    await postJson("/stream", { type: "token", text });
    process.stdout.write(JSON.stringify({ ok: true }) + "\n");
    return;
  }

  if (cmd === "done") {
    const state = args.state || "";
    await postJson("/stream", { type: "done", text: state });
    process.stdout.write(JSON.stringify({ ok: true, state: state || null }) + "\n");
    return;
  }

  if (cmd === "error") {
    const text = args._.slice(1).join(" ") || "error";
    await postJson("/stream", { type: "error", text });
    process.stdout.write(JSON.stringify({ ok: true }) + "\n");
    return;
  }

  console.error(
    "Unknown command. Use: serve | wait | say --state X | token TEXT | done [--state X] | health"
  );
  process.exit(1);
}

function startServer() {
  const server = createServer();
  server.listen(PORT, HOST, () => {
    console.log(`Rubber Duck bridge listening on ${BASE}/`);
    console.log(`Open ${BASE}/ in Chrome or Edge (mic needs a secure/local context).`);
    console.log(`Skill root: ${SKILL_ROOT}`);
  });
  const shutdown = () => {
    console.log("\nShutting down rubber duck bridge…");
    for (const c of sseClients) {
      try {
        c.end();
      } catch {
        /* ignore */
      }
    }
    server.close(() => process.exit(0));
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  runCli(process.argv.slice(2)).catch((err) => {
    console.error(err.message || err);
    process.exit(1);
  });
}

export { createServer, BASE, HOST, PORT };
