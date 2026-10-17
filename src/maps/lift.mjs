// A texture lifted off a view of it on its wall: the picture `placeView` draws of a texture's place (its camera
// from `texturePlaces`), read back into the texture's own pixels. Each pixel of the view is told which texel it
// shows by drawing the place once more wearing a texture whose every texel is its own colour, and the light it
// was seen in by drawing it in plain white under the map's light; the view's colour over that light is the
// texel's. Steven (2026-10-15): "When you have photos, I am not sure why you can't literally use the photo for the
// reference": a textures leg given views of each texture on its wall takes the texture itself from them.
//
//   liftTexture(bsp, name, view, { brightness }) -> { image: { width, height, rgb }, seen, saturated, tinted }
// `view`: { width, height, rgba } as placeView drew it. `seen`: the share of the texture's texels the view
// shows; the rest are filled from the nearest seen, wrapping, since a texture repeats. `saturated`: the share of
// the seen texels whose view was white (their colour only a floor).
import { texturePlaces, PLACE_BRIGHTNESS, placeView } from "./places.mjs";
import { drawMap } from "./draw.mjs";

/** A map texture of one size (no smaller ones: the drawing then reads it texel for texel), its pixels given. */
const texture = (name, width, height, pixels, palette) => ({ name, width, height, pixels, palette });
/** A palette whose colour i is grey i: a texel's index is read back off the drawing's red. */
const GREYS = Uint8Array.from({ length: 768 }, (_, i) => Math.floor(i / 3));
const paletteOf = (c) => Uint8Array.from({ length: 768 }, (_, i) => c[i % 3]);

/** A view pixel whose light's weakest channel is under this share of its strongest is tinted past reading. */
const TINTED = 0.15;

/** How far (texels) a gap between seen texels is closed from them before the texture is filled by repeating. */
const CLOSE = 2;

export function liftTexture(bsp, name, view, { brightness = PLACE_BRIGHTNESS, views = null } = {}) {
  const place = texturePlaces(bsp).find((p) => p.name.toLowerCase() === name.toLowerCase());
  if (!place) throw new Error(`no face of the map wears ${name}`);
  const { width: W, height: H } = place;
  // every other texture of the map in black, so that only this one's pixels are told
  const black = paletteOf([0, 0, 0]);
  const others = bsp.textures.filter((t) => t && t.name && t.name.toLowerCase() !== name.toLowerCase()).map((t) => texture(t.name, t.width || 16, t.height || 16, new Uint8Array((t.width || 16) * (t.height || 16)), black));
  const wearing = (pixels, palette) => [...others, texture(place.name, W, H, pixels, palette)];
  const sum = new Float64Array(W * H * 3);
  const count = new Uint32Array(W * H);
  let saturated = 0;
  let tinted = 0;
  // each shot: its picture and how to draw from its camera (the place view, and the map's views when given)
  // the place view, when there is one (shots fitted by photo.mjs come with their own cameras and none)
  const shots = view ? [{ picture: view, at: brightness, draw: (pixels, palette, light, b) => placeView(bsp, place, { textures: wearing(pixels, palette), brightness: b, light, wearing: "given" }) }] : [];
  if (views) {
    // the map's views as a sheet of tiles (viewsOf, as a textures leg is given them), with each tile's camera kept
    // beside it: a wall its place view shows a fifth of may be seen whole in a view of its room
    const [w, h] = [views.width ?? 320, views.height ?? 240];
    const cols = views.cols ?? Math.min(4, views.cameras.length);
    views.cameras.forEach((v, n) => {
      const [left, top] = [(n % cols) * w, Math.floor(n / cols) * h];
      if (top + h > views.picture.height || left + w > views.picture.width) return;
      const crop = new Uint8Array(w * h * 4);
      for (let y = 0; y < h; y++) crop.set(views.picture.rgba.subarray(((top + y) * views.picture.width + left) * 4, ((top + y) * views.picture.width + left + w) * 4), y * w * 4);
      const camera = { from: v.from, yaw: v.yaw, pitch: v.pitch, ...(v.fov ? { fov: v.fov } : {}), width: w, height: h, entities: "none", labels: false };
      shots.push({ picture: { width: w, height: h, rgba: crop }, at: views.brightness ?? 1.55, draw: (pixels, palette, light, b) => drawMap(bsp, { ...camera, textures: wearing(pixels, palette), brightness: b, light, wearing: "given" }), label: views.label === false ? 0 : 16 });
    });
  }
  // which texel each pixel shows: the texture drawn three times, its texels' indices the low bits of u, of v,
  // and their high bits (a palette holds 256 colours)
  const index = (f) => Uint8Array.from({ length: W * H }, (_, i) => f(i % W, Math.floor(i / W)));
  for (const shot of shots) {
    const { picture } = shot;
    const lowU = shot.draw(index((u) => u & 255), GREYS, false, shot.at);
    if (lowU.width !== picture.width || lowU.height !== picture.height) throw new Error(`the view is ${picture.width} x ${picture.height}; its place is drawn ${lowU.width} x ${lowU.height}: give the picture as the map's place view draws it`);
    const marker = shot.draw(new Uint8Array(W * H), paletteOf([255, 0, 255]), false, shot.at);
    let any = false;
    for (let i = 0; i < marker.width * marker.height && !any; i++) any = marker.rgba[i * 4] === 255 && marker.rgba[i * 4 + 1] === 0 && marker.rgba[i * 4 + 2] === 255;
    if (!any) continue;
    const lowV = shot.draw(index((u, v) => v & 255), GREYS, false, shot.at);
    const high = shot.draw(index((u, v) => ((u >> 8) & 15) | (((v >> 8) & 15) << 4)), GREYS, false, shot.at);
    const white = shot.draw(new Uint8Array(W * H), paletteOf([255, 255, 255]), true, 1);
    // a face drawn in no light (a lamp's own texture, glowing): the same at any brightness; its view is its colour.
    // Divided by the map's light, the lamps came back 50 to 115 levels off
    const grey = shot.draw(new Uint8Array(W * H), paletteOf([100, 100, 100]), true, 1);
    const greyBright = shot.draw(new Uint8Array(W * H), paletteOf([100, 100, 100]), true, 2);
    for (let i = 0; i < picture.width * picture.height; i++) {
      const k = i * 4;
      if (!(marker.rgba[k] === 255 && marker.rgba[k + 1] === 0 && marker.rgba[k + 2] === 255)) continue;
      // a sheet's tile carries its name in its top left: those pixels are the label's
      if (shot.label && Math.floor(i / picture.width) < shot.label) continue;
      const u = lowU.rgba[k] | ((high.rgba[k] & 15) << 8);
      const v = lowV.rgba[k] | ((high.rgba[k] >> 4) << 8);
      if (u >= W || v >= H) continue;
      // white in the view: its colour is lost, and a texel any shot sees unwhite is better from that one
      const white255 = picture.rgba[k] === 255 || picture.rgba[k + 1] === 255 || picture.rgba[k + 2] === 255;
      if (white255) saturated++;
      const at = v * W + u;
      const unlit = grey.rgba[k] === greyBright.rgba[k] && grey.rgba[k + 1] === greyBright.rgba[k + 1] && grey.rgba[k + 2] === greyBright.rgba[k + 2];
      // a light of one strong colour (a blue lamp on a teal tank) leaves the other channels nearly dark: they
      // cannot be divided back (c3a2a_tnk1b came back blue, 83 of delta E off)
      const lights = [0, 1, 2].map((c) => white.rgba[k + c]);
      // (a black texel is black under any light: not counted)
      if (!unlit && Math.max(...lights) >= 32 && Math.min(...lights) < TINTED * Math.max(...lights) && Math.max(picture.rgba[k], picture.rgba[k + 1], picture.rgba[k + 2]) > 8) tinted++;
      for (let c = 0; c < 3; c++) {
        const light = unlit ? 1 : (white.rgba[k + c] / 255) * shot.at;
        const seen = picture.rgba[k + c];
        sum[at * 3 + c] += light > 0.02 ? Math.min(255, seen / light) : seen;
      }
      count[at]++;
    }
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
  // first the gaps of a texture seen sparsely (a far wall: a pixel every few texels) closed from the seen texels
  // near them, each the mean of those within CLOSE: filled by the largest seen rectangle, which is one texel on
  // such a grid, they came back speckled (c3a2_bth1, its texel noise 14.8 against the game's 8.6)
  {
    const was = have.slice();
    const near = rgb.slice();
    const closed = new Uint8Array(W * H);
    for (let v = 0; v < H; v++)
      for (let u = 0; u < W; u++) {
        const i = v * W + u;
        if (was[i]) continue;
        const pooled = [0, 0, 0];
        let n = 0;
        for (let dv = -CLOSE; dv <= CLOSE; dv++)
          for (let du = -CLOSE; du <= CLOSE; du++) {
            const j = ((v + dv + H) % H) * W + ((u + du + W) % W);
            if (!was[j]) continue;
            for (let c = 0; c < 3; c++) pooled[c] += near[j * 3 + c];
            n++;
          }
        if (n < 2) continue;
        for (let c = 0; c < 3; c++) rgb[i * 3 + c] = Math.round(pooled[c] / n);
        have[i] = 1;
        closed[i] = 1;
      }
    // a closed texel is a mean, smoother than the texture: its grain is put back from the texel at the same place
    // of the largest rectangle seen whole, that texel less the mean round it (c3a1_w2 came back at a texel noise
    // of 5.3 against the game's 9.5, read by the judges as blocks where it has cracks)
    const whole = largestSeen(was, W, H);
    if (whole && whole.w * whole.h >= 16)
      for (let i = 0; i < W * H; i++) {
        if (!closed[i]) continue;
        const [u, v] = [i % W, Math.floor(i / W)];
        const [su, sv] = [whole.x + ((((u - whole.x) % whole.w) + whole.w) % whole.w), whole.y + ((((v - whole.y) % whole.h) + whole.h) % whole.h)];
        const mean = [0, 0, 0];
        let n = 0;
        for (let dv = -1; dv <= 1; dv++)
          for (let du = -1; du <= 1; du++) {
            const j = ((sv + dv + H) % H) * W + ((su + du + W) % W);
            if (!was[j]) continue;
            for (let c = 0; c < 3; c++) mean[c] += near[j * 3 + c];
            n++;
          }
        const j = sv * W + su;
        for (let c = 0; c < 3; c++) rgb[i * 3 + c] = Math.max(0, Math.min(255, Math.round(rgb[i * 3 + c] + near[j * 3 + c] - mean[c] / n)));
      }
  }
  // then by repeating the largest seen rectangle across the texture, as the texture repeats on a wall: a wall the
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
  return { image: { width: W, height: H, rgb }, seen: Math.round((seen / (W * H)) * 1000) / 1000, saturated: Math.round((saturated / Math.max(1, count.reduce((a, b) => a + b, 0))) * 1000) / 1000, tinted: Math.round((tinted / Math.max(1, count.reduce((a, b) => a + b, 0))) * 1000) / 1000 };
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
