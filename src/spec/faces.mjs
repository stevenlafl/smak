// What is painted on a flat face: panels (a drawer, a door, a slot, a pull, in relief that is only paint) and
// words. Used by a model's boxes (model.mjs) and by a texture of a map's .wad (wad.mjs).
import { zonePainter } from "./paint.mjs";
import { textMask } from "../render.mjs";

/** A box face's width and height in units, as a viewer facing it sees them. */
export function faceSize([x, y, z], f) {
  return f <= 1 ? [x, y] : f <= 3 ? [x, z] : [y, z];
}

/**
 * Panels painted on a box face, in the face's own units as a viewer facing it sees them: `at` [x, y] the
 * panel's middle from the face's bottom left, `size` [w, h], `shape` rect (unless told), round (corners of
 * `radius`) or ellipse, `style` inset (unless told: a drawer front's gap, a recess), raised (a plate, a pull)
 * or flat (a painted patch), `edge` the bevel's width (0.4), and `material` (the box's own unless told:
 * a resolved material). Later panels go over earlier ones. The bevel is painted lit from the top left.
 * `under` gives what is there already at a cell's pixel (the material's paint unless told).
 */
export function paintPanels(S, cell, panels, material, px, flip, across, [fw, fh], { under = zonePainter(material, cell, px) } = {}) {
  const kx = cell.w / fw;
  const ky = cell.h / fh;
  const fills = panels.map((panel) => (panel.material ? zonePainter(panel.material, cell, px) : null));
  S.zone(cell, (u, v) => {
    // the point in face units, x to the right and y up as the viewer sees the face
    const x = ((across ? cell.w - 1 - u : u) + 0.5) / kx;
    const y = fh - ((flip ? cell.h - 1 - v : v) + 0.5) / ky;
    let colour = under(u, v);
    panels.forEach((panel, i) => {
      const [cx, cy] = panel.at;
      const [w, h] = panel.size;
      const dx = x - cx;
      const dy = y - cy;
      // how far inside the shape's edge the point is, in units (under 0: outside)
      let inside;
      if (panel.shape === "ellipse") {
        const r = Math.hypot(dx / (w / 2), dy / (h / 2));
        inside = (1 - r) * Math.min(w, h) / 2;
      } else {
        const radius = panel.shape === "round" ? Math.min(panel.radius ?? Math.min(w, h) / 4, w / 2, h / 2) : 0;
        const qx = Math.abs(dx) - (w / 2 - radius);
        const qy = Math.abs(dy) - (h / 2 - radius);
        inside = radius - (Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0));
      }
      if (inside < 0) return;
      const edge = panel.edge ?? 0.4;
      const base = fills[i] ? fills[i](u, v) : colour;
      const style = panel.style ?? "inset";
      let shade = 1;
      if (style !== "flat" && inside < edge) {
        // on the bevel: which way it faces, from the nearest side of the shape (left or top lit)
        const nx = Math.abs(dx) / (w / 2);
        const ny = Math.abs(dy) / (h / 2);
        const lit = nx > ny ? (dx < 0 ? 1 : -1) : dy > 0 ? 1 : -1;
        shade = 1 + (style === "inset" ? -lit : lit) * 0.35;
      } else if (style === "inset") shade = 0.92;
      colour = base.map((c) => Math.max(0, Math.min(1, c * shade)));
    });
    return colour;
  }, 0);
}

/**
 * Words painted into one cell of a sheet: the labels' letters scaled to the cell (`size`, the share of its
 * height they take, 0.6 unless told), centred, in `ink` ([r, g, b] 0 to 1) over the material as it was
 * painted. `flip`: the cell's rows run up the face, so the letters go in turned over; `across`: its columns
 * run to the left as the face is seen from outside (the back, the left), so they go in mirrored.
 * `under` gives what is there already at a pixel (the material's paint unless told).
 */
export function paintWords(S, cell, { text, ink = [0.05, 0.05, 0.05], size = 0.6 }, material, px, flip, across, { under = zonePainter(material, cell, px) } = {}) {
  const one = textMask(text, 1);
  const k = Math.max(1, Math.floor(Math.min((cell.h * size) / one.height, (cell.w * 0.9) / one.width)));
  const mask = textMask(text, k);
  const x0 = (cell.w - mask.width) / 2;
  const y0 = (cell.h - mask.height) / 2;
  S.zone(cell, (u, v) => {
    const mx = Math.floor(across ? cell.w - 1 - u - x0 : u - x0);
    const my = Math.floor(flip ? cell.h - 1 - v - y0 : v - y0);
    return mask.at(mx, my) ? ink : under(u, v);
  }, 0);
}
