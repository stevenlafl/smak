// A texture lifted off a view of it on its wall: the picture `placeView` draws of a texture's place (its camera
// from `texturePlaces`), read back into the texture's own pixels. Each pixel of the view is told which texel it
// shows by drawing the place once more wearing a texture whose every texel is its own colour, and the light it
// was seen in by drawing it in plain white under the map's light; the view's colour over that light is the
// texel's. Steven (2026-10-15): "When you have photos, I am not sure why you can't literally use the photo for the
// reference": a textures leg given views of each texture on its wall takes the texture itself from them.
//
//   liftTexture(bsp, name, view, { brightness }) -> { image: { width, height, rgb }, seen, saturated }
// `view`: { width, height, rgba } as placeView drew it. `seen`: the share of the texture's texels the view
// shows; the rest are filled from the nearest seen, wrapping, since a texture repeats. `saturated`: the share of
// the seen texels whose view was white (their colour only a floor).
import { texturePlaces, PLACE_BRIGHTNESS, placeView } from "./places.mjs";

/** A map texture of one size (no smaller ones: the drawing then reads it texel for texel), its pixels given. */
const texture = (name, width, height, pixels, palette) => ({ name, width, height, pixels, palette });
/** A palette whose colour i is grey i: a texel's index is read back off the drawing's red. */
const GREYS = Uint8Array.from({ length: 768 }, (_, i) => Math.floor(i / 3));
const paletteOf = (c) => Uint8Array.from({ length: 768 }, (_, i) => c[i % 3]);

export function liftTexture(bsp, name, view, { brightness = PLACE_BRIGHTNESS } = {}) {
  const place = texturePlaces(bsp).find((p) => p.name.toLowerCase() === name.toLowerCase());
  if (!place) throw new Error(`no face of the map wears ${name}`);
  const { width: W, height: H } = place;
  // every other texture of the map in black, so that only this one's pixels are told
  const black = paletteOf([0, 0, 0]);
  const others = bsp.textures.filter((t) => t && t.name && t.name.toLowerCase() !== name.toLowerCase()).map((t) => texture(t.name, t.width || 16, t.height || 16, new Uint8Array((t.width || 16) * (t.height || 16)), black));
  const draw = (pixels, palette, light) => placeView(bsp, place, { textures: [...others, texture(place.name, W, H, pixels, palette)], brightness: light ? 1 : brightness, light, wearing: "given" });
  // which texel each pixel shows: the texture drawn three times, its texels' indices the low bits of u, of v,
  // and their high bits (a palette holds 256 colours)
  const index = (f) => Uint8Array.from({ length: W * H }, (_, i) => f(i % W, Math.floor(i / W)));
  const lowU = draw(index((u) => u & 255), GREYS, false);
  const lowV = draw(index((u, v) => v & 255), GREYS, false);
  const high = draw(index((u, v) => ((u >> 8) & 15) | (((v >> 8) & 15) << 4)), GREYS, false);
  const marker = draw(new Uint8Array(W * H), paletteOf([255, 0, 255]), false);
  const white = draw(new Uint8Array(W * H), paletteOf([255, 255, 255]), true);
  // a face drawn in no light (a lamp's own texture, glowing): the same at any brightness; its view is its colour.
  // Divided by the map's light, the lamps came back 50 to 115 levels off
  const grey = draw(new Uint8Array(W * H), paletteOf([100, 100, 100]), true);
  const greyBright = placeView(bsp, place, { textures: [...others, texture(place.name, W, H, new Uint8Array(W * H), paletteOf([100, 100, 100]))], brightness: 2, light: true, wearing: "given" });
  if (lowU.width !== view.width || lowU.height !== view.height) throw new Error(`the view is ${view.width} x ${view.height}; its place is drawn ${lowU.width} x ${lowU.height}: give the picture as the map's place view draws it`);
  const sum = new Float64Array(W * H * 3);
  const count = new Uint32Array(W * H);
  let saturated = 0;
  for (let i = 0; i < view.width * view.height; i++) {
    const k = i * 4;
    if (!(marker.rgba[k] === 255 && marker.rgba[k + 1] === 0 && marker.rgba[k + 2] === 255)) continue;
    const u = lowU.rgba[k] | ((high.rgba[k] & 15) << 8);
    const v = lowV.rgba[k] | ((high.rgba[k] >> 4) << 8);
    if (u >= W || v >= H) continue;
    // the light there at brightness 1, from white; the view was drawn at `brightness`
    const at = v * W + u;
    const unlit = grey.rgba[k] === greyBright.rgba[k] && grey.rgba[k + 1] === greyBright.rgba[k + 1] && grey.rgba[k + 2] === greyBright.rgba[k + 2];
    for (let c = 0; c < 3; c++) {
      const light = unlit ? 1 : (white.rgba[k + c] / 255) * brightness;
      const seen = view.rgba[k + c];
      sum[at * 3 + c] += light > 0.02 ? Math.min(255, seen / light) : seen;
    }
    if (view.rgba[k] === 255 || view.rgba[k + 1] === 255 || view.rgba[k + 2] === 255) saturated++;
    count[at]++;
  }
  const seen = count.reduce((n, c) => n + (c ? 1 : 0), 0);
  if (!seen) throw new Error(`the view shows no texel of ${name}`);
  // texels the view does not show: the nearest seen, wrapping (a texture repeats), by growing the seen outwards
  const rgb = new Uint8Array(W * H * 3);
  const have = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++)
    if (count[i]) {
      for (let c = 0; c < 3; c++) rgb[i * 3 + c] = Math.round(sum[i * 3 + c] / count[i]);
      have[i] = 1;
    }
  // first by repeating the largest seen rectangle across the texture, as the texture repeats on a wall: a wall the
  // view shows a fifth of came back as streaks when it was filled from its edges alone
  const box = largestSeen(have, W, H);
  if (box && box.w * box.h >= 64) {
    const was = have.slice();
    for (let v = 0; v < H; v++)
      for (let u = 0; u < W; u++) {
        const i = v * W + u;
        if (was[i]) continue;
        const j = (box.y + ((((v - box.y) % box.h) + box.h) % box.h)) * W + box.x + ((((u - box.x) % box.w) + box.w) % box.w);
        if (!was[j]) continue;
        rgb.set(rgb.subarray(j * 3, j * 3 + 3), i * 3);
        have[i] = 1;
      }
  }
  let left = have.reduce((n, h) => n + (h ? 0 : 1), 0);
  while (left > 0) {
    const was = have.slice();
    let grew = 0;
    for (let v = 0; v < H; v++)
      for (let u = 0; u < W; u++) {
        const i = v * W + u;
        if (was[i]) continue;
        for (const [du, dv] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const j = ((v + dv + H) % H) * W + ((u + du + W) % W);
          if (!was[j]) continue;
          rgb.set(rgb.subarray(j * 3, j * 3 + 3), i * 3);
          have[i] = 1;
          grew++;
          break;
        }
      }
    if (!grew) break;
    left -= grew;
  }
  return { image: { width: W, height: H, rgb }, seen: Math.round((seen / (W * H)) * 1000) / 1000, saturated: Math.round((saturated / Math.max(1, count.reduce((a, b) => a + b, 0))) * 1000) / 1000 };
}

/** The largest rectangle of seen texels (the maximal-rectangle-in-a-histogram walk, row by row). */
function largestSeen(have, W, H) {
  const heights = new Int32Array(W);
  let best = null;
  for (let v = 0; v < H; v++) {
    for (let u = 0; u < W; u++) heights[u] = have[v * W + u] ? heights[u] + 1 : 0;
    const stack = [];
    for (let u = 0; u <= W; u++) {
      const h = u < W ? heights[u] : 0;
      let start = u;
      while (stack.length && stack.at(-1)[1] >= h) {
        const [at, height] = stack.pop();
        const area = height * (u - at);
        if (!best || area > best.w * best.h) best = { x: at, y: v - height + 1, w: u - at, h: height };
        start = at;
      }
      stack.push([start, h]);
    }
  }
  return best && best.w * best.h > 0 ? best : null;
}
