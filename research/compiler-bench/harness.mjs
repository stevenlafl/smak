// Run: BENCH_OUT=$(mktemp -d) THREADS=12 node bench1.mjs (then bench2, bench3, bench4; bench3 and bench4 read B/ and E/ from bench1).
// SDHLT built at /media/Data3/Packages/SDHLT/tools. Results of the 2026-10-14 run are in bench*.out and seal-tests.json;
// research/compiler-features.md reads them.
// Compile test harness for SDHLT features: writes a .map, runs the four tools with given args, measures the .bsp.
import { maps } from "/media/Data3/Packages/smak/src/index.mjs";
import { spawnSync } from "node:child_process";
import { writeFileSync, readFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

export const TOOLS = "/media/Data3/Packages/SDHLT/tools";
export const OUT = process.env.BENCH_OUT;
const TOOL = { csg: "sdHLCSG", bsp: "sdHLBSP", vis: "sdHLVIS", rad: "sdHLRAD" };

/** A test .wad of plain pictures, once. */
export function testWad() {
  const file = join(OUT, "test.wad");
  if (existsSync(file)) return file;
  const pic = (r, g, b, size = 64) => {
    const rgb = new Uint8Array(size * size * 3);
    for (let i = 0; i < size * size; i++) {
      const n = ((i % size) ^ Math.floor(i / size)) & 8 ? 20 : 0;
      rgb.set([Math.min(255, r + n), Math.min(255, g + n), Math.min(255, b + n)], i * 3);
    }
    return { width: size, height: size, rgb };
  };
  writeFileSync(file, maps.writeWad([
    { name: "FLOOR", image: pic(120, 110, 90) }, { name: "WALL", image: pic(150, 150, 140) },
    { name: "CEIL", image: pic(100, 100, 110) }, { name: "WOOD", image: pic(110, 70, 40) },
    { name: "STONE", image: pic(90, 90, 90) }, { name: "%WOOD", image: pic(110, 70, 40) },
    { name: "%20WOOD", image: pic(110, 70, 40) }, { name: "LAMP", image: pic(250, 240, 200) },
    { name: "!WATER", image: pic(40, 60, 120) },
  ]));
  return file;
}

/** GLQuake's AllocBlock (gl_rsurf.c): 128x128 blocks, first fit by lowest skyline. Returns blocks used. */
export function allocBlocks(bsp) {
  const W = 128, H = 128;
  const blocks = [];
  let used = 0, luxels = 0;
  for (const face of bsp.faces) {
    if (face.edgeCount < 3) continue;
    const name = bsp.textures[bsp.texinfo[face.texinfo].texture]?.name ?? "";
    if (/^(sky|!|\*)/i.test(name)) continue;
    let size;
    try { size = maps.lightmapSize(bsp, face); } catch { continue; }
    const w = size.width, h = size.height;
    luxels += w * h;
    let placed = false;
    for (let t = 0; !placed; t++) {
      if (!blocks[t]) blocks[t] = new Array(W).fill(0);
      const a = blocks[t];
      let best = H, bx = 0;
      for (let i = 0; i < W - w; i++) {
        let best2 = 0, j;
        for (j = 0; j < w; j++) {
          if (a[i + j] >= best) break;
          if (a[i + j] > best2) best2 = a[i + j];
        }
        if (j === w) { bx = i; best = best2; }
      }
      if (best + h > H) continue;
      for (let i = 0; i < w; i++) a[bx + i] = best + h;
      placed = true;
      used = Math.max(used, t + 1);
    }
  }
  return { blocks: used, luxels };
}

/** Clipnodes reachable from a model's hull head. */
function hullCount(bsp, model, hull) {
  const head = bsp.models[model].headNodes[hull];
  if (head < 0) return 0;
  const seen = new Set();
  const stack = [head];
  while (stack.length) {
    const n = stack.pop();
    if (n < 0 || seen.has(n)) continue;
    seen.add(n);
    stack.push(...bsp.clipnodes[n].children);
  }
  return seen.size;
}

/** Writes the map, compiles it with the args given, and measures. */
export function run(name, map, args = {}, { vis = true, rad = true, folder } = {}) {
  const dir = folder ?? join(OUT, name);
  mkdirSync(dir, { recursive: true });
  const base = join(dir, name);
  const wad = testWad();
  map.worldspawn = { ...(map.worldspawn ?? {}), wad: [wad, join(TOOLS, "sdhlt.wad")] };
  writeFileSync(`${base}.map`, maps.writeMap(map));
  const steps = ["csg", "bsp", ...(vis ? ["vis"] : []), ...(rad ? ["rad"] : [])];
  const r = { name, seconds: {}, warnings: [], errors: [] };
  for (const step of steps) {
    const t0 = Date.now();
    const threads = args.threads === 0 ? [] : ["-threads", String(args.threads ?? process.env.THREADS ?? 12)];
    const p = spawnSync(join(TOOLS, TOOL[step]), [...threads, ...(args[step] ?? []), base], { cwd: dir, encoding: "latin1", maxBuffer: 1 << 28, timeout: (step === "vis" || step === "rad" ? 300 : 120) * 1000 });
    if (p.error?.code === "ETIMEDOUT") r.timedOut = step;
    r.seconds[step] = (Date.now() - t0) / 1000;
    const text = `${p.stdout}${p.stderr}`;
    writeFileSync(`${base}.${step}.txt`, text);
    for (const line of text.split(/\r?\n/)) {
      if (/warning/i.test(line)) r.warnings.push(`${step}: ${line.trim()}`);
      if (/error|leak/i.test(line)) r.errors.push(`${step}: ${line.trim()}`);
    }
    const avg = /average leafs visible:\s*(\d+)/i.exec(text);
    if (avg) r.avgVisible = Number(avg[1]);
    const ab = /\* AllocBlock\s+(\d+)\/(\d+)/.exec(text);
    if (ab) r.allocChart = Number(ab[1]);
    if (r.timedOut) break;
  }
  if (!existsSync(`${base}.bsp`)) return { ...r, failed: true };
  let bsp; try { bsp = maps.readBsp(readFileSync(`${base}.bsp`)); } catch (e) { return { ...r, failed: true, errors: [...r.errors, String(e.message)] }; }
  if (!bsp.models.length) return { ...r, failed: true };
  const prt = existsSync(`${base}.prt`) ? readFileSync(`${base}.prt`, "latin1").split(/\s+/).filter(Boolean).slice(0, 2).map(Number) : [0, 0];
  const ab = allocBlocks(bsp);
  Object.assign(r, {
    planes: bsp.planes.length, nodes: bsp.nodes.length, leaves: bsp.leaves.length, faces: bsp.faces.length,
    worldFaces: bsp.models[0].faceCount, marksurfaces: bsp.marksurfaces.length, clipnodes: bsp.clipnodes.length,
    hull1: hullCount(bsp, 0, 1), hull2: hullCount(bsp, 0, 2), hull3: hullCount(bsp, 0, 3),
    texinfo: bsp.texinfo.length, vertices: bsp.vertices.length, models: bsp.models.length,
    lightBytes: bsp.lumps.lighting.length, visBytes: bsp.lumps.visibility.length,
    portalLeaves: prt[0], portals: prt[1], luxels: ab.luxels, blocks: ab.blocks,
  });
  return r;
}

export const COLS = ["avgVisible", "allocChart", "planes", "nodes", "leaves", "faces", "worldFaces", "marksurfaces", "clipnodes", "hull1", "hull2", "hull3", "texinfo", "portals", "luxels", "blocks", "lightBytes", "visBytes"];
export function table(rows, cols = COLS) {
  const head = ["case", ...cols, "csg s", "bsp s", "vis s", "rad s"];
  const lines = [head.join(" | ")];
  for (const r of rows) {
    if (r.failed) { lines.push(`${r.name} | FAILED: ${r.errors.slice(0, 3).join(" / ")}`); continue; }
    lines.push([r.name + (r.timedOut ? ` [${r.timedOut} stopped at 300 s]` : ""), ...cols.map((c) => r[c]), ...["csg", "bsp", "vis", "rad"].map((s) => r.seconds[s]?.toFixed(2) ?? "-")].join(" | "));
  }
  return lines.join("\n");
}
