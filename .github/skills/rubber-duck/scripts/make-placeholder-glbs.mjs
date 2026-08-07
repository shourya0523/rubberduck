#!/usr/bin/env node
/**
 * Generate tiny placeholder duck GLBs (no deps).
 * Replace these files with real models later — keep the same names.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, "../assets");

function sphere(radius, segments, color) {
  const positions = [];
  const normals = [];
  const colors = [];
  const indices = [];
  const [cr, cg, cb] = color;

  for (let y = 0; y <= segments; y++) {
    const v = y / segments;
    const phi = v * Math.PI;
    for (let x = 0; x <= segments; x++) {
      const u = x / segments;
      const theta = u * Math.PI * 2;
      const nx = Math.sin(phi) * Math.cos(theta);
      const ny = Math.cos(phi);
      const nz = Math.sin(phi) * Math.sin(theta);
      positions.push(nx * radius, ny * radius, nz * radius);
      normals.push(nx, ny, nz);
      colors.push(cr, cg, cb);
    }
  }

  const ring = segments + 1;
  for (let y = 0; y < segments; y++) {
    for (let x = 0; x < segments; x++) {
      const a = y * ring + x;
      const b = a + ring;
      indices.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }
  return { positions, normals, colors, indices };
}

function transformMesh(mesh, { tx = 0, ty = 0, tz = 0, sx = 1, sy = 1, sz = 1 } = {}) {
  const positions = mesh.positions.map((v, i) => {
    const axis = i % 3;
    if (axis === 0) return v * sx + tx;
    if (axis === 1) return v * sy + ty;
    return v * sz + tz;
  });
  return { ...mesh, positions };
}

function mergeMeshes(meshes) {
  const positions = [];
  const normals = [];
  const colors = [];
  const indices = [];
  let base = 0;
  for (const m of meshes) {
    positions.push(...m.positions);
    normals.push(...m.normals);
    colors.push(...m.colors);
    for (const i of m.indices) indices.push(i + base);
    base += m.positions.length / 3;
  }
  return { positions, normals, colors, indices };
}

function buildDuck(variant) {
  const yellow = [1.0, 0.82, 0.2];
  const orange = [1.0, 0.45, 0.1];
  const white = [0.95, 0.95, 0.95];
  const black = [0.1, 0.1, 0.1];

  let tilt = 0;
  let bounce = 0;
  let wingSpread = 0;
  if (variant === "thinking") {
    tilt = 0.25;
    bounce = -0.05;
  } else if (variant === "excited") {
    bounce = 0.18;
    wingSpread = 0.35;
  }

  const body = transformMesh(sphere(0.55, 16, yellow), {
    ty: 0.45 + bounce,
    sy: 0.9,
    sz: 1.1,
  });
  const head = transformMesh(sphere(0.32, 14, yellow), {
    ty: 1.05 + bounce + tilt * 0.1,
    tz: 0.25,
    sx: 1.05,
  });
  const beak = transformMesh(sphere(0.14, 10, orange), {
    ty: 0.98 + bounce,
    tz: 0.55,
    sx: 1.4,
    sy: 0.7,
    sz: 1.1,
  });
  const eyeL = transformMesh(sphere(0.05, 8, black), {
    tx: -0.12,
    ty: 1.12 + bounce,
    tz: 0.48,
  });
  const eyeR = transformMesh(sphere(0.05, 8, black), {
    tx: 0.12,
    ty: 1.12 + bounce,
    tz: 0.48,
  });
  const wingL = transformMesh(sphere(0.28, 12, yellow), {
    tx: -0.5 - wingSpread,
    ty: 0.5 + bounce,
    tz: 0,
    sx: 0.45,
    sy: 0.7,
    sz: 1.0,
  });
  const wingR = transformMesh(sphere(0.28, 12, yellow), {
    tx: 0.5 + wingSpread,
    ty: 0.5 + bounce,
    tz: 0,
    sx: 0.45,
    sy: 0.7,
    sz: 1.0,
  });
  const belly = transformMesh(sphere(0.35, 12, white), {
    ty: 0.35 + bounce,
    tz: 0.15,
    sy: 0.8,
    sz: 0.9,
  });

  // Apply thinking tilt by shifting head/beak sideways-up
  if (variant === "thinking") {
    for (const m of [head, beak, eyeL, eyeR]) {
      for (let i = 0; i < m.positions.length; i += 3) {
        const x = m.positions[i];
        const y = m.positions[i + 1];
        const c = Math.cos(tilt);
        const s = Math.sin(tilt);
        m.positions[i] = x * c - (y - 1.0) * s;
        m.positions[i + 1] = x * s + (y - 1.0) * c + 1.0;
      }
    }
  }

  return mergeMeshes([body, belly, head, beak, eyeL, eyeR, wingL, wingR]);
}

function align4(n) {
  return (n + 3) & ~3;
}

function writeGlb(filePath, mesh) {
  const pos = new Float32Array(mesh.positions);
  const norm = new Float32Array(mesh.normals);
  const col = new Float32Array(mesh.colors);
  const idx = new Uint32Array(mesh.indices);

  const posBytes = pos.byteLength;
  const normBytes = norm.byteLength;
  const colBytes = col.byteLength;
  const idxBytes = idx.byteLength;

  let offset = 0;
  const posOffset = offset;
  offset += align4(posBytes);
  const normOffset = offset;
  offset += align4(normBytes);
  const colOffset = offset;
  offset += align4(colBytes);
  const idxOffset = offset;
  offset += align4(idxBytes);
  const binSize = offset;

  const bin = Buffer.alloc(binSize);
  Buffer.from(pos.buffer, pos.byteOffset, posBytes).copy(bin, posOffset);
  Buffer.from(norm.buffer, norm.byteOffset, normBytes).copy(bin, normOffset);
  Buffer.from(col.buffer, col.byteOffset, colBytes).copy(bin, colOffset);
  Buffer.from(idx.buffer, idx.byteOffset, idxBytes).copy(bin, idxOffset);

  const gltf = {
    asset: { version: "2.0", generator: "rubber-duck-placeholders" },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0, name: "Duck" }],
    meshes: [
      {
        name: "DuckMesh",
        primitives: [
          {
            attributes: { POSITION: 0, NORMAL: 1, COLOR_0: 2 },
            indices: 3,
            mode: 4,
          },
        ],
      },
    ],
    accessors: [
      {
        bufferView: 0,
        componentType: 5126,
        count: pos.length / 3,
        type: "VEC3",
        max: [1.2, 1.6, 1.2],
        min: [-1.2, 0, -1.2],
      },
      {
        bufferView: 1,
        componentType: 5126,
        count: norm.length / 3,
        type: "VEC3",
      },
      {
        bufferView: 2,
        componentType: 5126,
        count: col.length / 3,
        type: "VEC3",
      },
      {
        bufferView: 3,
        componentType: 5125,
        count: idx.length,
        type: "SCALAR",
      },
    ],
    bufferViews: [
      { buffer: 0, byteOffset: posOffset, byteLength: posBytes, target: 34962 },
      { buffer: 0, byteOffset: normOffset, byteLength: normBytes, target: 34962 },
      { buffer: 0, byteOffset: colOffset, byteLength: colBytes, target: 34962 },
      { buffer: 0, byteOffset: idxOffset, byteLength: idxBytes, target: 34963 },
    ],
    buffers: [{ byteLength: binSize }],
  };

  let json = Buffer.from(JSON.stringify(gltf), "utf8");
  const jsonPadding = (4 - (json.length % 4)) % 4;
  if (jsonPadding) json = Buffer.concat([json, Buffer.alloc(jsonPadding, 0x20)]);

  const totalLength = 12 + 8 + json.length + 8 + bin.length;
  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546c67, 0); // glTF
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(totalLength, 8);

  const jsonChunkHeader = Buffer.alloc(8);
  jsonChunkHeader.writeUInt32LE(json.length, 0);
  jsonChunkHeader.writeUInt32LE(0x4e4f534a, 4); // JSON

  const binChunkHeader = Buffer.alloc(8);
  binChunkHeader.writeUInt32LE(bin.length, 0);
  binChunkHeader.writeUInt32LE(0x004e4942, 4); // BIN

  fs.writeFileSync(filePath, Buffer.concat([header, jsonChunkHeader, json, binChunkHeader, bin]));
  console.log(`Wrote ${filePath} (${totalLength} bytes)`);
}

fs.mkdirSync(OUT, { recursive: true });
for (const variant of ["base", "thinking", "excited"]) {
  writeGlb(path.join(OUT, `duck-${variant}.glb`), buildDuck(variant));
}
