// How deep and wide a character's trunk stands against its height: the corners hung on spine, pelvis and neck
// bones, in the first frame of its first animation, each submodel 0 of every bodypart. Numbers only; nothing of
// the models is written. node research/torso-bulk.mjs <mdl> ...
//
// 2026-10-16, asked whether brief-built characters stand out because their gear stands off the body. Valve's
// people: depth 0.13 to 0.25 of their height and width 0.16 to 0.25 (barney 0.17/0.23, scientist 0.17/0.20,
// gman 0.13/0.20, hassassin 0.14/0.16, player 0.19/0.21, The Specialists' seal, merc, gordon 0.24-0.25/0.23-0.24);
// but the grunt, with his pack and webbing, is 0.38/0.40. The brief builds the line-up caught: seal 0.41/0.34,
// barney 0.33/0.33, merc 0.33/0.30 (merc passed it). Bulk alone does not tell ours from Valve's (the grunt is as
// bulky); what the pictures show is crude shape (a cube of a vest, plates standing off the chest). No check made.
import { readMdl, readMesh, apply34 } from "../src/mdl.mjs";
import { posed } from "../src/render.mjs";
import { readStudio } from "../src/studio-file.mjs";

const TRUNK = /spine|dorso|pelvis|bacino|neck|collo/i;

export function torsoBulk(src) {
  const info = readMdl(src);
  const matrices = posed(src, { seq: 0, frame: 0 }).pose;
  const all = [], trunk = [];
  for (const bodypart of info.bodyparts) {
    const model = bodypart.models.find((m) => m.meshes.some((x) => x.numtris)) ;
    if (!model) continue;
    for (const mesh of model.meshes)
      for (const t of readMesh(src, model, mesh))
        for (const c of t) {
          const p = apply34(matrices[c.bone], c.p);
          all.push(p);
          if (TRUNK.test(info.bones[c.bone])) trunk.push(p);
        }
  }
  const ext = (ps, a) => Math.max(...ps.map((p) => p[a])) - Math.min(...ps.map((p) => p[a]));
  const height = ext(all, 2);
  return { height: +height.toFixed(1), depth: +(ext(trunk, 0) / height).toFixed(3), width: +(ext(trunk, 1) / height).toFixed(3) };
}

if (import.meta.url.endsWith(process.argv[1]?.split("/").pop()))
  for (const f of process.argv.slice(2)) {
    try {
      console.log(f.split("/").slice(-3).join("/"), JSON.stringify(torsoBulk(readStudio(f).src)));
    } catch (e) {
      console.log(f, e.message);
    }
  }
