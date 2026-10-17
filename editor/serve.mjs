// The model editor's server: the page, and the model work the page asks for, done here in Node with smak.
//   node bin/smak.mjs edit <folder of models, or one model> [--port 8097] [--work folder]
//                          [--engine goldsrc|xash]
// The folder of models is only read. Projects (<name>.smakproj.json), the pictures that replace textures and
// the saved models (<name>.out.mdl) go to the work folder (default smak-projects, where the command is run),
// under the same sub-folders as the models. `engine` is the one a new project's saved model is checked for.
// Listens on 127.0.0.1 only.
//
// How this file is laid out: a `site` is what one running editor knows (its folders, its engine); every call
// of the API is a function of the site and the request's query (and body), kept in two tables, CALLS
// (answered with JSON) and PICTURES (answered with a picture or a file); `answer` finds the function for a
// request, and `serve` starts it.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { readdirSync, statSync, existsSync, mkdirSync, writeFileSync, unlinkSync } from "node:fs";
import { join, resolve, dirname, extname, basename, relative } from "node:path";
import { fileURLToPath } from "node:url";
import {
  newProject,
  readProject,
  patchProject,
  sourceAt,
  sourceOf,
  textureFor,
  pictureFor,
  selectionOf,
  maskShown,
  bakedOf,
  saveBake,
  sha1,
  smak,
} from "./project.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
// this machine only
const HOST = "127.0.0.1";
// the port, unless told
const EDITOR_PORT = 8097;
// the content type of each kind of file the page is made of
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".css": "text/css",
};
// the files of the page that are served: anything straight inside page/, and core.mjs
const PAGE_FILE = /^(page\/[\w.-]+|core\.mjs)$/;
// how many folders down from the folder of models a model is looked for
const FOLDERS_DEEP = 3;
// how many replaced pictures of one texture stay on the disk for undo
const PICTURES_KEPT = 8;
// a texture's flag for "masked": its last colour is a hole
const MASKED = 64;
// smak's picture of the model, when the page does not say: its size, the angle across it, where the eye
// stands
const RENDER_DEFAULTS = { w: 640, h: 480, fov: 90, yaw: 30, pitch: 15 };

/** A shape's numbers to four decimals, and a frame's to seven: what the page is sent. */
const round4 = (value) => Math.round(value * 1e4) / 1e4;
const round7 = (value) => Math.round(value * 1e7) / 1e7;
const withoutBmp = (name) => name.replace(/\.bmp$/i, "");

// ── the site: the folders one editor works in ──────────────────────────────
/**
 * What a running editor knows: { models (the folder of models, only read), work (where projects go), engine
 * (what a new project is checked for), first (the model it was started on, when it was given one and not a
 * folder) }.
 */
function siteOf(models, work, engine) {
  models = resolve(models);
  const first = statSync(models).isDirectory() ? null : basename(models);
  if (first) models = dirname(models);
  return { models, work: resolve(work), engine, first };
}
/** Every .mdl under the folder of models, by its path from that folder (its id), in order. */
function listModels(site) {
  const under = (dir, depth) =>
    readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) return depth < FOLDERS_DEEP ? under(path, depth + 1) : [];
      return /\.mdl$/i.test(entry.name) ? [relative(site.models, path).replace(/\\/g, "/")] : [];
    });
  return under(site.models, 0).sort();
}
/** The file of a model by its id; an id that leaves the folder, or names no model, is refused. */
function modelPath(site, id) {
  const path = resolve(site.models, id);
  if (relative(site.models, path).startsWith("..") || !/\.mdl$/i.test(path) || !existsSync(path))
    throw new Error(`no model ${id}`);
  return path;
}
/** The model file as it is on the disk now: its time and size, or null when it is gone. */
function stampOf(site, id) {
  try {
    const stat = statSync(modelPath(site, id));
    return `${stat.mtimeMs}:${stat.size}`;
  } catch {
    return null;
  }
}
const projPath = (site, id) => join(site.work, id.replace(/\.mdl$/i, "") + ".smakproj.json");
const freshProject = (site, id) => newProject(modelPath(site, id), projPath(site, id), site.engine);
/** A model's project: the one on the disk, or a new one not yet written. */
const projectOf = (site, id) => readProject(projPath(site, id)) ?? freshProject(site, id);
function patch(site, id, body) {
  const result = patchProject(projPath(site, id), body, freshProject(site, id));
  return { project: result.project, inverse: result.inverse };
}
/**
 * A model's source, a texture's number and its entry in the project, for the calls that are about one
 * texture.
 */
function textureAsked(site, query) {
  const src = sourceAt(modelPath(site, query.model));
  const number = Number(query.i);
  return { src, number, texture: src.info.textures[number] };
}

// ── the calls answered with JSON ───────────────────────────────────────────
function models(site) {
  return {
    folder: site.models,
    work: site.work,
    first: site.first,
    models: listModels(site).map((id) => ({
      id,
      project: existsSync(projPath(site, id)),
      bytes: statSync(join(site.models, id)).size,
    })),
  };
}
/** Everything the page needs of a model but its shapes, pictures and frames, and the project as it stands. */
function open(site, query) {
  const src = sourceAt(modelPath(site, query.model));
  const info = src.info;
  return {
    id: query.model,
    stamp: stampOf(site, query.model),
    path: src.path,
    projectPath: projPath(site, query.model),
    bytes: src.bytes,
    notes: src.notes,
    viewModel: src.viewModel,
    bones: src.ctx.bones.map((bone) => ({
      name: bone.name,
      parent: bone.parent,
      pos: bone.pos,
      rot: bone.rot,
    })),
    seqs: src.ctx.seqs,
    textures: info.textures.map((texture) => ({
      name: texture.name,
      flags: texture.flags,
      width: texture.width,
      height: texture.height,
    })),
    skins: smak.skinFamilies(src.buf),
    bodyparts: info.bodyparts.map((bodypart) => ({
      name: bodypart.name,
      base: bodypart.base,
      models: bodypart.models.map((model) => ({
        name: model.name,
        verts: model.numverts,
        tris: model.meshes.reduce((sum, mesh) => sum + mesh.numtris, 0),
        meshes: model.meshes.map((mesh) => ({ skinref: mesh.skinref, tris: mesh.numtris })),
      })),
    })),
    attachments: smak.attachments(src.buf),
    project: projectOf(site, query.model),
  };
}
/**
 * One submodel's triangles, mesh by mesh, corner by corner: points and normals in their bones' space, texture
 * pixels, bones.
 */
function geometry(site, query) {
  const src = sourceAt(modelPath(site, query.model));
  const model = src.info.bodyparts[Number(query.bp)]?.models[Number(query.sub)];
  if (!model) throw new Error("no such submodel");
  const meshes = model.meshes
    .filter((mesh) => mesh.numtris)
    .map((mesh) => {
      const corners = smak.readMesh(src.buf, model, mesh).flat();
      return {
        skinref: mesh.skinref,
        p: corners.flatMap((corner) => corner.p.map(round4)),
        n: corners.flatMap((corner) => corner.n.map(round4)),
        uv: corners.flatMap((corner) => [corner.s, corner.t]),
        bone: corners.map((corner) => corner.bone),
      };
    });
  return { meshes };
}
/** A source animation's frames: for each frame, for each bone, six numbers. */
function seq(site, query) {
  const frames = sourceAt(modelPath(site, query.model)).ctx.base(Number(query.n));
  return { frames: frames.map((frame) => frame.map((values) => values.map(round7))) };
}
const project = (site, query) => projectOf(site, query.model);
/**
 * What the page asks every second, to take up what changed under it: the project's revision, the model file's
 * stamp (null: gone) and the list of models'.
 */
function rev(site, query) {
  const file = query.model ? projPath(site, query.model) : null;
  const written = file && existsSync(file);
  return {
    rev: written ? readProject(file).rev : 0,
    mtime: written ? statSync(file).mtimeMs : 0,
    src: query.model ? stampOf(site, query.model) : null,
    list: sha1(listModels(site).join("\n")),
  };
}
/**
 * The picture a patch's entry would have a texture replaced with, when it names one: `textures.n.file`, or
 * `textures.n`.
 */
function pictureNamed(entry) {
  if (entry.path?.[0] !== "textures") return null;
  if (entry.path.length === 3 && entry.path[2] === "file") return entry.value;
  if (entry.path.length === 2) return entry.value?.file;
  return null;
}
function patchCall(site, query, body) {
  const asked = JSON.parse(body.toString("utf8"));
  // an undo may name a picture again that was dropped on a texture long ago and has been removed since: said,
  // not written
  for (const entry of asked.set ?? []) {
    const file = pictureNamed(entry);
    if (file && !existsSync(resolve(dirname(projPath(site, query.model)), file)))
      throw new Error(
        `the picture ${file} is not on the disk any more: of the pictures a texture was replaced with, the last ${PICTURES_KEPT} are kept`,
      );
  }
  return patch(site, query.model, asked);
}
/**
 * A name not yet taken in `dir`: the stem, the time in base 36, the extension. Two in one millisecond are two
 * files.
 */
function freeName(dir, stem, extension) {
  let stamp = Date.now();
  let name;
  do name = `${stem}${(stamp++).toString(36)}${extension}`;
  while (existsSync(join(dir, name)));
  return name;
}
/**
 * The pictures dropped on one texture before (their names begin with `stem`), which the project no longer
 * names, removed but for the newest PICTURES_KEPT of them.
 */
function removeOldPictures(dir, stem, projectNow) {
  const named = new Set(
    Object.values(projectNow.textures ?? {})
      .map((entry) => entry?.file)
      .filter(Boolean),
  );
  // only what `upload` itself names so: a file an agent put there under another name stays
  const ours = new RegExp(`^${stem}[0-9a-z]{8,9}\\.(png|bmp)$`);
  const loose = readdirSync(dir)
    .filter((file) => ours.test(file) && !named.has(`${basename(dir)}/${file}`))
    .map((file) => ({ file, at: statSync(join(dir, file)).mtimeMs }))
    .sort((a, b) => b.at - a.at || (a.file < b.file ? 1 : -1));
  for (const { file } of loose.slice(PICTURES_KEPT))
    try {
      unlinkSync(join(dir, file));
    } catch {
      /* gone already */
    }
}
/**
 * A picture dropped on a texture: kept beside the project, and the project told of it. The pictures dropped
 * on that texture before, which the project no longer names, are then removed, but for the newest
 * PICTURES_KEPT of them: an undo that goes back to one of those still finds it. A picture the project names
 * (for this texture or another) is never removed.
 */
function upload(site, query, body) {
  const { number, texture } = textureAsked(site, query);
  if (!texture) throw new Error("no such texture");
  const extension = body.toString("latin1", 0, 2) === "BM" ? ".bmp" : ".png";
  // read once here, so that a file that is no picture is refused before it is kept
  if (extension === ".png") smak.unpng(body);
  else smak.unbmp(body);
  const dir = projPath(site, query.model).replace(/\.smakproj\.json$/, ".tex");
  const stem = `${number}_${withoutBmp(texture.name).replace(/[^A-Za-z0-9_-]+/g, "_")}_`;
  mkdirSync(dir, { recursive: true });
  const name = freeName(dir, stem, extension);
  writeFileSync(join(dir, name), body);
  const set = [{ path: ["textures", number, "file"], value: `${basename(dir)}/${name}` }];
  if (!projectOf(site, query.model).textures?.[number]?.name)
    set.unshift({ path: ["textures", number, "name"], value: texture.name });
  const done = patch(site, query.model, {
    set,
    what: `texture ${texture.name} replaced from ${query.name ?? "a picture"}`,
    by: query.by ?? "person",
  });
  removeOldPictures(dir, stem, done.project);
  return done;
}
/**
 * The colour under a pixel of a texture's picture before its adjustments (what a selection by colour is made
 * on), and what the project's selection takes of the picture. The pixel by `x`, `y`, or by `u`, `v`: how far
 * across and down, 0 to 1.
 */
function pixel(site, query) {
  const { src, number, texture } = textureAsked(site, query);
  if (!texture) throw new Error("no such texture");
  const file = projPath(site, query.model);
  const entry = projectOf(site, query.model).textures?.[number];
  const picture = pictureFor(src, number, entry, file);
  const x = Math.floor(query.u !== undefined ? Number(query.u) * picture.width : Number(query.x));
  const y = Math.floor(query.v !== undefined ? Number(query.v) * picture.height : Number(query.y));
  if (!(x >= 0 && y >= 0 && x < picture.width && y < picture.height)) {
    // said as it was asked for: by pixel, or by how far across and down
    const asked =
      query.u !== undefined ? `${query.u},${query.v} of the way across and down` : `${query.x},${query.y}`;
    throw new Error(`no pixel ${asked} in a picture of ${picture.width}x${picture.height}`);
  }
  const index = picture.pixels[y * picture.width + x];
  // everything the selection counts, but for the table of which colours are on
  const { on, ...count } = selectionOf(src, number, entry, file);
  return {
    x,
    y,
    index,
    colour: [...picture.palette.subarray(index * 3, index * 3 + 3)],
    hole: Boolean(picture.flags & MASKED) && index === 255,
    ...count,
  };
}
function bake(site, query, body) {
  const asked = body.length ? JSON.parse(body.toString("utf8")) : {};
  return saveBake(projectOf(site, query.model), projPath(site, query.model), {
    out: asked.out || undefined,
    engine: asked.engine || undefined,
  });
}
// the route /api/<name> for each: the names are the page's and the tests' to call, and stay
const CALLS = { models, open, geometry, seq, project, rev, patch: patchCall, upload, pixel, bake };

// ── the calls answered with a picture, or a file to keep ───────────────────
/**
 * A texture as the project has it (`orig`: as the source has it; `adjust`: with these adjustments instead;
 * `plain`: the picture without its adjustments, replaced or not; `mask`: the colours its selection leaves
 * alone dimmed; `uv`: enlarged, with the triangles that wear it). `as` (png or bmp): as a file to keep.
 */
function texturePicture(site, query) {
  const { src, number } = textureAsked(site, query);
  const file = projPath(site, query.model);
  const entry = query.orig
    ? null
    : {
        ...(projectOf(site, query.model).textures?.[number] ?? {}),
        ...(query.adjust ? { adjust: JSON.parse(query.adjust) } : {}),
      };
  if (query.plain && entry) delete entry.adjust;
  let texture = textureFor(src, number, entry, file);
  if (query.mask && entry?.adjust?.select && !query.as)
    texture = maskShown(texture, selectionOf(src, number, entry, file).on);
  if (query.uv) return smak.uvMap(smak.replaceTexture(src.buf, number, texture), number);
  if (query.as === "bmp")
    return { file: smak.bmp(texture), name: withoutBmp(texture.name) + ".bmp", type: "image/bmp" };
  if (query.as === "png")
    return {
      file: smak.png(texture.width, texture.height, smak.rgbaOf(texture)),
      name: withoutBmp(texture.name) + ".png",
      type: "image/png",
    };
  // for the page to wear: a masked texture's holes are see-through
  const holes = Boolean(texture.flags & MASKED);
  return { width: texture.width, height: texture.height, rgba: smak.rgbaOf(texture, holes) };
}
/** smak's own picture of the model as the project bakes it (`orig`: of the source): what an agent sees. */
function renderPicture(site, query) {
  const file = projPath(site, query.model);
  const projectNow = projectOf(site, query.model);
  const mdl = query.orig ? sourceOf(projectNow, file).buf : bakedOf(projectNow, file).mdl;
  const number = (name, otherwise) => (query[name] === undefined ? otherwise : Number(query[name]));
  // `target` (x,y,z) and `dist`: the page's orbit camera, the eye that far from that point; `both`: both
  // sides of every triangle
  return smak.render(mdl, {
    view: query.view ?? (sourceAt(modelPath(site, query.model)).viewModel ? "first" : "orbit"),
    seq: number("anim", 0),
    frame: number("frame", 0),
    body: number("body", 0),
    skin: number("skin", 0),
    width: number("w", RENDER_DEFAULTS.w),
    height: number("h", RENDER_DEFAULTS.h),
    fov: number("fov", RENDER_DEFAULTS.fov),
    yaw: number("yaw", RENDER_DEFAULTS.yaw),
    pitch: number("pitch", RENDER_DEFAULTS.pitch),
    ...(query.target ? { target: query.target.split(",").map(Number) } : {}),
    ...(query.dist ? { dist: Number(query.dist) } : {}),
    cull: query.both !== "1",
  });
}
const PICTURES = { texture: texturePicture, render: renderPicture };

// ── a request answered ─────────────────────────────────────────────────────
const NO_STORE = { "cache-control": "no-store" };
/** /api/<name>: a picture (or a file to keep) from PICTURES, or JSON from CALLS. */
async function answerCall(site, name, query, req, res) {
  // the body is read whole before anything is answered, whatever the call
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (Object.hasOwn(PICTURES, name)) {
    const made = PICTURES[name](site, query);
    if (made.file)
      res
        .writeHead(200, {
          "content-type": made.type,
          "content-disposition": `attachment; filename="${made.name}"`,
        })
        .end(made.file);
    else
      res
        .writeHead(200, { "content-type": "image/png", ...NO_STORE })
        .end(smak.png(made.width, made.height, made.rgba));
    return;
  }
  if (!Object.hasOwn(CALLS, name)) {
    res.writeHead(404).end("no such call");
    return;
  }
  // made before the answer is begun: a call that is refused is answered as an error, not as 200
  const made = JSON.stringify(CALLS[name](site, query, Buffer.concat(chunks)));
  res.writeHead(200, { "content-type": "application/json", ...NO_STORE }).end(made);
}
/** A file of the page. */
async function answerFile(path, res) {
  const file = path === "/" ? "page/index.html" : path.slice(1);
  if (!PAGE_FILE.test(file)) {
    res.writeHead(404).end("not found");
    return;
  }
  res
    .writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream", ...NO_STORE })
    .end(await readFile(join(HERE, file)));
}
/**
 * One request: a call of the API, or a file of the page. What goes wrong is answered as { error }: nothing a
 * request holds stops the server.
 */
async function answer(site, req, res) {
  const asJson = { "content-type": "application/json" };
  let path;
  let query;
  // an address that cannot be read (a percent sign with no character after it) is answered, not thrown
  try {
    const url = new URL(req.url, "http://x");
    path = decodeURIComponent(url.pathname);
    query = Object.fromEntries(url.searchParams);
  } catch {
    res.writeHead(400, asJson).end(JSON.stringify({ error: `the address ${req.url} cannot be read` }));
    return;
  }
  const isCall = path.startsWith("/api/");
  try {
    if (isCall) await answerCall(site, path.slice("/api/".length), query, req, res);
    else await answerFile(path, res);
  } catch (error) {
    if (!res.headersSent) res.writeHead(isCall ? 400 : 404, asJson);
    res.end(JSON.stringify({ error: error.message }));
  }
}

/**
 * Starts the editor over a folder of models (or one model: its folder, and that model opened first). Resolves
 * to the server once it listens; rejects when it cannot (the port is taken).
 */
export function serve(modelsPath, { port = EDITOR_PORT, work = "smak-projects", engine = "goldsrc", say = console.log } = {}) {
  const site = siteOf(modelsPath, work, engine);
  return new Promise((ready, refuse) => {
    const server = createServer((req, res) => answer(site, req, res));
    server.once("error", refuse);
    server.listen(port, HOST, () => {
      const opened = site.first ? `?model=${encodeURIComponent(site.first)}` : "";
      say(
        `smak editor: http://${HOST}:${port}/${opened}   (Ctrl+C stops it)\n  models from ${site.models} (only read)\n  projects and saved models in ${site.work}, checked for ${engine}`,
      );
      ready(server);
    });
  });
}
