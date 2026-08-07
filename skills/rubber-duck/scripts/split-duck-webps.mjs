#!/usr/bin/env node
/**
 * Split source/duck-anim.webp into looping state WebPs.
 * Requires: Python 3 + Pillow (`pip install Pillow`)
 *
 * Frame ranges (24fps source, 240 frames):
 *   base     0–23   (idle bob)
 *   thinking 72–108 (thinker pose)
 *   excited  150–173 (jump cycle)
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const py = `
from PIL import Image
from pathlib import Path
src = Path(${JSON.stringify(path.join(root, "assets/source/duck-anim.webp"))})
out_dir = Path(${JSON.stringify(path.join(root, "assets"))})
im = Image.open(src)
ranges = {"base": range(0, 24), "thinking": range(72, 109), "excited": range(150, 174)}
for name, rng in ranges.items():
    imgs = []
    for i in rng:
        im.seek(i)
        frame = im.convert("RGBA")
        w, h = frame.size
        frame = frame.resize((960, int(h * 960 / w)), Image.Resampling.LANCZOS)
        imgs.append(frame)
    duration = 1000 // 24
    dest = out_dir / f"duck-{name}.webp"
    imgs[0].save(dest, save_all=True, append_images=imgs[1:], duration=duration, loop=0, lossless=False, quality=80, method=4)
    imgs[0].convert("RGB").save(out_dir / f"duck-{name}-poster.jpg", quality=85)
    print(name, len(imgs), "->", dest, dest.stat().st_size)
`;

const r = spawnSync("python3", ["-c", py], { stdio: "inherit" });
process.exit(r.status ?? 1);
