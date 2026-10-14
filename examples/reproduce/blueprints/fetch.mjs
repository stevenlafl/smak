// Fetch the drawings and photographs of the "Houses from their drawings" test from the Library of Congress (LOC),
// and make of them the pictures the maker and the judge are given. Node 18, no dependencies.
//
//   node examples/reproduce/blueprints/fetch.mjs [moulton|kaupo|grindle ...] [--refresh] [--remake]
//
// For each house it reads the item's JSON (kept as input/item.json; --refresh asks again), downloads the chosen
// sheets as TIFF and the chosen photographs as the 1024 px JPEG into <house>/input/, then writes
//   sheet-<n>.png   the whole sheet, 4000 px wide, grey
//   plan-<storey>.png   each floor plan cut from its sheet, about 2000 px on its long side
//   photo-<n>.png   each photograph, as served (1024 px)
//   manifest.json   what each file is: caption, URL, size, and the credit line
// It keeps to LOC's limits (https://www.loc.gov/apis/json-and-yaml/working-within-limits/): 20 JSON requests a
// minute, 150 file requests a minute; it pauses and tries again on 429 or a CAPTCHA page. It can be stopped and run
// again: a file whose size is the server's Content-Length is not fetched again, and a picture newer than its
// source is not made again (--remake makes them all).

import { createWriteStream, existsSync, mkdirSync, readFileSync, renameSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { readTiff, scaleBox, pngOf } from "./tiff.mjs";
import { unjpeg } from "../../../src/import-jpeg.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const UA = "curl/8.5.0";
const CREDIT = "Historic American Buildings Survey, National Park Service; Library of Congress, Prints & Photographs Division";

// The sheets and photographs each house's test uses, by LOC's file names, and where each floor plan is on its
// sheet: [left, top, right, bottom] as shares of the sheet, read off the sheets by eye (a plan's region is not
// found by the script, since the sheets also carry titles, scales and notes beside the plans).
const HOUSES = {
  moulton: {
    item: "wy0573",
    sheets: ["00001a", "00002a", "00003a"],
    plans: {
      "00001a": { main: [0.14, 0.22, 0.48, 0.87], second: [0.55, 0.22, 0.83, 0.87] },
      "00003a": { basement: [0.17, 0.26, 0.45, 0.87] },
    },
    photos: ["580694", "580695", "580696", "580698", "580700", "580701"],
  },
  kaupo: {
    item: "hi1133",
    sheets: ["00002a", "00003a", "00004a", "00005a"],
    plans: { "00002a": { first: [0.2, 0.05, 0.8, 0.95] } },
    photos: ["392486", "392490", "392494", "392495", "392496", "392497"],
  },
  grindle: {
    item: "me0420",
    // 2 and 3 the plans, 4 and 5 the outside elevations, 6 to 10 the rooms' walls (their heights)
    sheets: ["00002a", "00003a", "00004a", "00005a", "00006a", "00007a", "00008a", "00009a", "00010a"],
    plans: {
      "00002a": { first: [0.085, 0.05, 0.455, 0.94], basement: [0.52, 0.12, 0.84, 0.95] },
      "00003a": { attic: [0.11, 0.11, 0.45, 0.94], second: [0.56, 0.08, 0.88, 0.94] },
    },
    photos: ["578527", "578529", "578532", "578534", "578537", "578540"],
  },
};

const args = process.argv.slice(2);
const refresh = args.includes("--refresh"), remake = args.includes("--remake");
const chosen = args.filter((a) => !a.startsWith("--"));
for (const c of chosen) if (!HOUSES[c]) throw new Error(`no house called ${c}: ${Object.keys(HOUSES).join(", ")}`);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const t0 = Date.now();
const log = (s) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1).padStart(6)} s] ${s}`);

// One gap between requests of each kind: 20 a minute is one in 3 s (3.5 for margin), 150 a minute one in 0.4 s.
const GAP = { json: 3500, file: 500 };
const last = { json: 0, file: 0 };
async function turn(kind) {
  const wait = last[kind] + GAP[kind] - Date.now();
  if (wait > 0) await sleep(wait);
  last[kind] = Date.now();
}

// A request with a timeout, tried again after a network fault, a 5xx, a 429 or a CAPTCHA page (each pause longer).
async function request(url, { kind, method = "GET", expect, idle = 60000 }) {
  let pause = 60000;
  for (let attempt = 1; ; attempt++) {
    await turn(kind);
    const ctl = new AbortController();
    let timer = setTimeout(() => ctl.abort(), idle);
    try {
      const res = await fetch(url, { method, headers: { "User-Agent": UA, Accept: "*/*" }, signal: ctl.signal, redirect: "follow" });
      const type = res.headers.get("content-type") || "";
      const captcha = res.ok && method === "GET" && expect !== "html" && /text\/html/.test(type);
      if (res.status === 429 || captcha) {
        clearTimeout(timer);
        if (attempt > 6) throw new Error(`${url}: still refused after ${attempt} tries`);
        log(`${res.status === 429 ? "429" : "a CAPTCHA page"} for ${url}: pausing ${pause / 1000} s`);
        await res.body?.cancel();
        await sleep(pause);
        pause = Math.min(pause * 2, 600000);
        continue;
      }
      if (res.status >= 500) throw new Error(`HTTP ${res.status}`);
      if (!res.ok) {
        clearTimeout(timer);
        throw Object.assign(new Error(`${url}: HTTP ${res.status}`), { final: true });
      }
      return { res, ctl, rearm: () => { clearTimeout(timer); timer = setTimeout(() => ctl.abort(), idle); }, done: () => clearTimeout(timer) };
    } catch (e) {
      clearTimeout(timer);
      if (e.final || attempt >= 5) throw e;
      log(`${url}: ${e.message || e.name}, try ${attempt + 1} in ${5 * attempt} s`);
      await sleep(5000 * attempt);
    }
  }
}

// A file downloaded unless it is there at the server's size. Returns { bytes, fetched }.
async function download(url, file) {
  const head = await request(url, { kind: "file", method: "HEAD" });
  head.done();
  const size = Number(head.res.headers.get("content-length"));
  if (existsSync(file) && size && statSync(file).size === size) return { bytes: size, fetched: false };
  for (let attempt = 1; ; attempt++) {
    const r = await request(url, { kind: "file" });
    const part = `${file}.part`;
    const out = createWriteStream(part);
    let got = 0;
    try {
      for await (const piece of r.res.body) {
        r.rearm();
        got += piece.length;
        if (!out.write(piece)) await new Promise((ok) => out.once("drain", ok));
      }
      r.done();
      await new Promise((ok, no) => out.end((e) => (e ? no(e) : ok())));
      if (size && got !== size) throw new Error(`got ${got} bytes of ${size}`);
      renameSync(part, file);
      return { bytes: got, fetched: true };
    } catch (e) {
      r.done();
      out.destroy();
      if (attempt >= 4) throw e;
      log(`${url}: ${e.message || e.name}, downloading again`);
      await sleep(5000 * attempt);
    }
  }
}

const newer = (made, source) => !remake && existsSync(made) && statSync(made).mtimeMs >= statSync(source).mtimeMs;

// The item's files: for each, its caption, the TIFF and the largest JPEG.
function entries(item) {
  const list = [];
  for (const group of item.resources || [])
    for (const f of group.files || []) {
      const tif = f.find((v) => v.mimetype === "image/tiff");
      const jpg = f.filter((v) => /jpe?g/.test(v.mimetype || "")).sort((a, b) => (b.width || 0) - (a.width || 0))[0];
      const caption = f.find((v) => v.use === "caption")?.title;
      if (tif) list.push({ group: group.caption, caption, tif: tif.url, jpg: jpg?.url, id: tif.url.split("/").pop().replace(/\.tif$/, "") });
    }
  return list;
}

async function house(name) {
  const H = HOUSES[name];
  const dir = join(HERE, name, "input");
  mkdirSync(dir, { recursive: true });
  const itemFile = join(dir, "item.json");
  let item;
  try {
    if (refresh) throw 0;
    item = JSON.parse(readFileSync(itemFile, "utf8"));
  } catch {
    const r = await request(`https://www.loc.gov/item/${H.item}/?fo=json`, { kind: "json" });
    const text = await r.res.text();
    r.done();
    item = JSON.parse(text);
    writeFileSync(itemFile, text);
    log(`${name}: item JSON read`);
  }
  const all = entries(item);
  let before = null;
  try { before = JSON.parse(readFileSync(join(dir, "manifest.json"), "utf8")); } catch {}
  const manifest = {
    house: name, item: `https://www.loc.gov/item/${H.item}/`, title: item.item?.title, rights: item.item?.rights_advisory,
    credit: CREDIT, sheets: [], plans: [], photos: [],
  };
  for (const id of H.sheets) {
    const e = all.find((x) => x.id === id && /drawing/i.test(x.group));
    if (!e) throw new Error(`${name}: no sheet ${id} in the item`);
    const n = Number(id.replace(/\D/g, ""));
    const tif = join(dir, `${id}.tif`);
    let t = Date.now();
    const d = await download(e.tif, tif);
    log(`${name}: sheet ${n} ${d.fetched ? "downloaded" : "already here"}, ${(d.bytes / 1e6).toFixed(1)} MB${d.fetched ? ` in ${((Date.now() - t) / 1000).toFixed(1)} s` : ""}`);
    const png = join(dir, `sheet-${n}.png`);
    const plans = H.plans[id] || {};
    const planFiles = Object.keys(plans).map((s) => join(dir, `plan-${s}.png`));
    let kind = before?.sheets?.find((s) => s.n === n)?.kind;
    if (![png, ...planFiles].every((f) => newer(f, tif))) {
      t = Date.now();
      const img = readTiff(readFileSync(tif));
      kind = img.kind;
      const whole = scaleBox(img, 4000);
      writeFileSync(png, pngOf(whole));
      for (const [storey, [l, tp, r, b]] of Object.entries(plans)) {
        const area = { x: Math.round(l * img.width), y: Math.round(tp * img.height) };
        area.w = Math.round(r * img.width) - area.x;
        area.h = Math.round(b * img.height) - area.y;
        const long = Math.max(area.w, area.h), outW = Math.round((2000 * area.w) / long);
        writeFileSync(join(dir, `plan-${storey}.png`), pngOf(scaleBox(img, outW, area)));
      }
      log(`${name}: sheet ${n} (${img.kind}) made into sheet-${n}.png${planFiles.length ? ` and ${Object.keys(plans).map((s) => `plan-${s}.png`).join(", ")}` : ""} in ${((Date.now() - t) / 1000).toFixed(1)} s`);
    }
    manifest.sheets.push({ n, caption: e.caption, url: e.tif, file: `${id}.tif`, png: `sheet-${n}.png`, bytes: d.bytes, kind });
    for (const [storey, box] of Object.entries(plans)) manifest.plans.push({ storey, sheet: n, box, png: `plan-${storey}.png` });
  }
  for (const id of H.photos) {
    const e = all.find((x) => x.id === `${id}pu` && /photo/i.test(x.group));
    if (!e) throw new Error(`${name}: no photograph ${id} in the item`);
    const jpg = join(dir, `${id}v.jpg`);
    const d = await download(e.jpg, jpg);
    const png = join(dir, `photo-${id}.png`);
    if (!newer(png, jpg)) {
      const pic = unjpeg(readFileSync(jpg));
      writeFileSync(png, pngOf({ width: pic.width, height: pic.height, channels: 3, data: pic.rgb }));
    }
    log(`${name}: photograph ${id} ${d.fetched ? "downloaded" : "already here"}, ${(d.bytes / 1e3).toFixed(0)} kB`);
    manifest.photos.push({ id, caption: e.caption, url: e.jpg, file: `${id}v.jpg`, png: `photo-${id}.png`, bytes: d.bytes });
  }
  writeFileSync(join(dir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
}

for (const name of chosen.length ? chosen : Object.keys(HOUSES)) await house(name);
log("done");
