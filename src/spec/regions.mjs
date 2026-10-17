// A model's picture laid as Valve lays its own (research/valve-uv.md): the body cut into regions by the bones its
// corners hang on (the head, the chest, the hips, the legs, the feet, the arms, the hands), each region projected
// flat from the side that sees each of its faces best (src/spec/charts.mjs, one region at a time: its front and its
// back as a rule), and the regions packed on the sheet at one scale, the head at twice. A right limb that is the
// left's mirror takes the left's place on the picture, as Valve's arms share one: one picture for the pair.
// Valve's barney wears a picture of each region seen straight on (the vest's front with its logo, its back with
// SECURITY, the face a portrait); at the rest pose 54 to 100 in 100 of its models' triangles lie on islands that are
// flat projections. The automatic charts of the whole body cut it into fragments that look like nothing.
//
//   regionLayout(meshes, { weight })  meshes as model.mjs builds them (corners { p, uv, bone }, partOf, image):
//                                     each mesh's corners laid again and its picture carried over, point for point.
//                                     Returns { regions, charts, shared, used } (used: the share of the sheet the
//                                     charts' boxes cover).
import { boneIn } from "../biped.mjs";

/**
 * A face goes to its region's front or back picture, by the way it faces along the model's x; to a side picture
 * only when it faces that side nearly square (its x under SIDE_X), and to a picture from above or below when it
 * faces up or down more than any other way (a box's top was laid over its side). Each picture is every such face
 * of the region, connected or not (both legs' fronts on one, as Valve's): charted face by face by the way each saw
 * best, a generated guard came out in 115 pieces.
 */
const SIDE_X = 0.35;
/** The way each picture of a region is seen from: [right, up] axes of its plane. */
const FACES = {
  front: { right: [0, 1, 0], up: [0, 0, 1] },
  back: { right: [0, -1, 0], up: [0, 0, 1] },
  left: { right: [-1, 0, 0], up: [0, 0, 1] },
  right: { right: [1, 0, 0], up: [0, 0, 1] },
  top: { right: [0, 1, 0], up: [1, 0, 0] },
  below: { right: [0, 1, 0], up: [-1, 0, 0] },
};
/** The regions of a Biped, by its bones in English: whatever language a skeleton names them in is matched by boneIn. */
const BIPED = [
  ["head", ["Bip01 Head", "Bip01 Neck", "Bip01 HeadNub"]],
  ["chest", ["Bip01 Spine1", "Bip01 Spine2", "Bip01 Spine3", "Bip01 L Clavicle", "Bip01 R Clavicle"]],
  ["hips", ["Bip01 Pelvis", "Bip01 Spine", "Bip01"]],
  ["leg", ["Bip01 L Thigh", "Bip01 R Thigh", "Bip01 L Calf", "Bip01 R Calf", "Bip01 L Leg", "Bip01 R Leg", "Bip01 L Leg1", "Bip01 R Leg1"]],
  ["foot", ["Bip01 L Foot", "Bip01 R Foot", "Bip01 L Toe0", "Bip01 R Toe0"]],
  ["arm", ["Bip01 L UpperArm", "Bip01 R UpperArm", "Bip01 L Forearm", "Bip01 R Forearm", "Bip01 L Arm", "Bip01 R Arm", "Bip01 L Arm1", "Bip01 R Arm1", "Bip01 L Arm2", "Bip01 R Arm2"]],
  ["hand", ["Bip01 L Hand", "Bip01 R Hand"]],
];
/** Other skeletons' bones, by words in their names. */
const BY_WORD = [
  ["head", /head|neck|skull|jaw|face/i],
  ["hand", /hand|finger|thumb|palm|claw/i],
  ["foot", /foot|toe|heel/i],
  ["arm", /arm|elbow|shoulder|wrist/i],
  ["leg", /thigh|calf|leg|knee|shin/i],
  ["hips", /pelvis|hip|root/i],
  ["chest", /spine|chest|torso|clavicle|body/i],
];
/** A region's texels a unit against the rest: the face is the picture people look at (Valve's 91 x 108 for barney's). */
const WEIGHT = { head: 2 };

/** A bone's region and side: { region, side } (side "L", "R" or ""), from its name. */
export function regionOfBone(name) {
  if (typeof name !== "string" || !name) return { region: "body", side: "" };
  const side = /(^|\s)(L|SX|Left)(\s|\d|$)/i.test(name) ? "L" : /(^|\s)(R|DX|Right)(\s|\d|$)/i.test(name) ? "R" : "";
  for (const [region, bones] of BIPED) if (bones.some((bone) => boneIn(bone, [name]) === name)) return { region, side };
  for (const [region, word] of BY_WORD) if (word.test(name)) return { region, side };
  return { region: name, side };
}

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

/** The bone most of a triangle's corners hang on. */
function boneOf(tri) {
  const counts = new Map();
  for (const c of tri) counts.set(c.bone, (counts.get(c.bone) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1])[0][0];
}

export function regionLayout(meshes, { pad = 2, weight = WEIGHT } = {}) {
  let regionsAll = 0;
  let chartsAll = 0;
  let sharedAll = 0;
  let usedSum = 0;
  for (const mesh of meshes) {
    const { width: W, height: H } = mesh.image;
    const tris = mesh.tris;
    if (!tris.length) continue;
    // each face's region: its part, and on a skeleton the region of the bones it hangs on; elsewhere (a prop's
    // parts, a weapon's) its part, by its side. Two parts are never one picture: a vest over the chest would share
    // the chest's texels where they lie one before the other, as Valve keeps its gear on pictures of their own
    const keyOf = tris.map((t, f) => {
      const part = String(mesh.partOf?.[f] ?? "part").split(".")[0];
      const bone = boneOf(t);
      if (bone !== undefined && bone !== "root") {
        const { region, side } = regionOfBone(bone);
        return { part, region, side };
      }
      const y = (t[0].p[1] + t[1].p[1] + t[2].p[1]) / 3;
      return { part, region: part, side: Math.abs(y) < 0.01 ? "" : y > 0 ? "L" : "R" };
    });
    const groups = new Map();
    keyOf.forEach((k, f) => {
      const g = `${k.part}|${k.region}|${k.side}`;
      if (!groups.has(g)) groups.set(g, { ...k, faces: [] });
      groups.get(g).faces.push(f);
    });
    // a right region that is a left's mirror (each face's mirror across y 0 is a face of the left) shares its
    // picture: the left of the same part, or of another part of the same region (an arm_l and an arm_r)
    const centre = (t) => [0, 1, 2].map((k) => (t[0].p[k] + t[1].p[k] + t[2].p[k]) / 3);
    const cell = (p) => p.map((v) => Math.round(v * 2)).join(",");
    const partnerOf = new Map();
    const mirrorOf = (g, left) => {
      const grid = new Map();
      for (const f of left.faces) {
        const k = cell(centre(tris[f]));
        if (!grid.has(k)) grid.set(k, []);
        grid.get(k).push(f);
      }
      const found = new Map();
      for (const f of g.faces) {
        const m = centre(tris[f]);
        m[1] = -m[1];
        const [a, b, c] = m.map((v) => Math.round(v * 2));
        let best = null;
        for (let i = -1; i <= 1; i++)
          for (let j = -1; j <= 1; j++)
            for (let k = -1; k <= 1; k++)
              for (const h of grid.get(`${a + i},${b + j},${c + k}`) ?? []) {
                const d = Math.hypot(...sub(centre(tris[h]), m));
                if (d < 0.3 && (!best || d < best.d)) best = { h, d };
              }
        if (!best) return null;
        found.set(f, best.h);
      }
      return found;
    };
    for (const g of groups.values()) {
      if (g.side !== "R") continue;
      const lefts = [...groups.values()].filter((l) => l.side === "L" && l.region === g.region && l.faces.length === g.faces.length);
      // the same part's left first
      lefts.sort((a, b) => (b.part === g.part) - (a.part === g.part));
      for (const left of lefts) {
        // every face of it, or none: a face left over would have no place on the picture
        const found = mirrorOf(g, left);
        if (!found) continue;
        g.shares = true;
        for (const [f, h] of found) partnerOf.set(f, h);
        break;
      }
    }
    // each region (but a shared right) charted on its own: its faces to the sides that see them, projected flat
    const charts = [];
    const proj = new Array(tris.length);
    for (const g of groups.values()) {
      if (g.shares) continue;
      const sides = new Map();
      for (const f of g.faces) {
        const [a, b, c] = tris[f].map((corner) => corner.p);
        const n = (([x, y, z]) => { const l = Math.hypot(x, y, z) || 1; return [x / l, y / l, z / l]; })(cross(sub(b, a), sub(c, a)));
        const side = Math.abs(n[2]) > Math.max(Math.abs(n[0]), Math.abs(n[1])) ? (n[2] > 0 ? "top" : "below") : Math.abs(n[0]) >= SIDE_X ? (n[0] > 0 ? "front" : "back") : n[1] > 0 ? "left" : "right";
        if (!sides.has(side)) sides.set(side, []);
        sides.get(side).push(f);
      }
      for (const [side, faces] of sides) {
        const { right, up } = FACES[side];
        for (const f of faces) proj[f] = tris[f].map((c) => [dot(c.p, right), -dot(c.p, up)]);
        const pts = faces.flatMap((f) => proj[f]);
        const min = [Math.min(...pts.map((q) => q[0])), Math.min(...pts.map((q) => q[1]))];
        const max = [Math.max(...pts.map((q) => q[0])), Math.max(...pts.map((q) => q[1]))];
        charts.push({ key: `${g.part}|${g.region}`, region: g.region, side, faces, min, w: Math.max(max[0] - min[0], 0.01), h: Math.max(max[1] - min[1], 0.01), k: weight[g.region] ?? 1 });
      }
    }
    // packed region by region, the tallest first within each, at the one scale that fills the sheet
    const order = [...new Set(charts.map((c) => c.key))];
    const sorted = [...charts].sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key) || b.h * b.k - a.h * a.k);
    const fits = (s) => {
      let x = 0;
      let y = 0;
      let row = 0;
      for (const c of sorted) {
        const w = c.w * s * c.k + 2 * pad;
        const h = c.h * s * c.k + 2 * pad;
        if (w > W) return false;
        if (x + w > W) (y += row, (x = 0), (row = 0));
        c.at = [x + pad, y + pad];
        x += w;
        row = Math.max(row, h);
      }
      return y + row <= H;
    };
    let [lo, hi] = [0.001, 1000];
    for (let i = 0; i < 50; i++) {
      const mid = (lo + hi) / 2;
      if (fits(mid)) lo = mid;
      else hi = mid;
    }
    fits(lo);
    const uv = new Array(tris.length);
    let boxes = 0;
    for (const c of sorted) {
      boxes += c.w * lo * c.k * c.h * lo * c.k;
      for (const f of c.faces) uv[f] = proj[f].map(([u, v]) => [(c.at[0] + (u - c.min[0]) * lo * c.k) / W, (c.at[1] + (v - c.min[1]) * lo * c.k) / H]);
    }
    // a shared right face: each corner the place of its mirror corner of the left face
    for (const [f, h] of partnerOf)
      uv[f] = tris[f].map((c) => {
        const m = [c.p[0], -c.p[1], c.p[2]];
        let k = 0;
        for (let j = 1; j < 3; j++) if (Math.hypot(...sub(tris[h][j].p, m)) < Math.hypot(...sub(tris[h][k].p, m))) k = j;
        return uv[h][k];
      });
    // the picture carried over: each texel of the new layout takes the colour of the same point of the surface in
    // the old one, so what the materials and the finish painted stays where it was on the body
    const was = mesh.image.rgb;
    const rgb = new Uint8Array(W * H * 3);
    const covered = new Uint8Array(W * H);
    tris.forEach((t, f) => {
      const A = [uv[f][0][0] * W, uv[f][0][1] * H];
      const B = [uv[f][1][0] * W, uv[f][1][1] * H];
      const C = [uv[f][2][0] * W, uv[f][2][1] * H];
      const area2 = (B[0] - A[0]) * (C[1] - A[1]) - (C[0] - A[0]) * (B[1] - A[1]);
      if (Math.abs(area2) < 1e-9) return;
      const old = t.map((c) => [c.uv[0] * W, c.uv[1] * H]);
      for (let y = Math.max(0, Math.floor(Math.min(A[1], B[1], C[1]))); y <= Math.min(H - 1, Math.ceil(Math.max(A[1], B[1], C[1]))); y++)
        for (let x = Math.max(0, Math.floor(Math.min(A[0], B[0], C[0]))); x <= Math.min(W - 1, Math.ceil(Math.max(A[0], B[0], C[0]))); x++) {
          const w1 = ((x + 0.5 - A[0]) * (C[1] - A[1]) - (C[0] - A[0]) * (y + 0.5 - A[1])) / area2;
          const w2 = ((B[0] - A[0]) * (y + 0.5 - A[1]) - (x + 0.5 - A[0]) * (B[1] - A[1])) / area2;
          const w0 = 1 - w1 - w2;
          if (w0 < -0.02 || w1 < -0.02 || w2 < -0.02) continue;
          const ox = Math.min(W - 1, Math.max(0, Math.floor(old[0][0] * w0 + old[1][0] * w1 + old[2][0] * w2)));
          const oy = Math.min(H - 1, Math.max(0, Math.floor(old[0][1] * w0 + old[1][1] * w1 + old[2][1] * w2)));
          const i = y * W + x;
          for (let k = 0; k < 3; k++) rgb[i * 3 + k] = was[(oy * W + ox) * 3 + k];
          covered[i] = 1;
        }
    });
    // past each chart's edge by a few texels, the edge's colour: no seam of the old picture shows where a
    // smaller copy of the texture is drawn at a distance
    for (let step = 0; step < pad + 2; step++) {
      const next = Uint8Array.from(covered);
      for (let y = 0; y < H; y++)
        for (let x = 0; x < W; x++) {
          const i = y * W + x;
          if (covered[i]) continue;
          const sum = [0, 0, 0];
          let n = 0;
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const xx = x + dx;
            const yy = y + dy;
            if (xx < 0 || yy < 0 || xx >= W || yy >= H || !covered[yy * W + xx]) continue;
            for (let k = 0; k < 3; k++) sum[k] += rgb[(yy * W + xx) * 3 + k];
            n++;
          }
          if (!n) continue;
          for (let k = 0; k < 3; k++) rgb[i * 3 + k] = Math.round(sum[k] / n);
          next[i] = 1;
        }
      covered.set(next);
    }
    mesh.image = { ...mesh.image, rgb };
    mesh.tris = tris.map((t, f) => t.map((c, k) => ({ ...c, uv: uv[f][k] })));
    regionsAll += groups.size;
    chartsAll += charts.length;
    sharedAll += partnerOf.size;
    usedSum += boxes / (W * H);
  }
  return { regions: regionsAll, charts: chartsAll, shared: sharedAll, used: meshes.length ? usedSum / meshes.length : 0 };
}

