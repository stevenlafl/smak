// A map swept for what a player would find wrong by walking it, with no game and no AI: the deterministic checks
// Steven's play-test of the frenzy reproductions asked for (examples/reproduce/reviews/maps-2026-10-14.json).
//
//   sweepOf(bsp, { reach }) -> { drops, floating, facts }
//
// drops: places a player walks to and can step off, falling further than Half-Life's safe fall (580 units a
// second, sv_gravity 800: about 210 units), each with the floor walked from and the one landed on. floating:
// lights with nothing solid within LIGHT_REACH of them in any of the six directions: a lamp in mid-air. The
// walk test's own finds (what is not reached, what stands in solid, one-way places) are its own report.
import { reachOf } from "./reach.mjs";
import { contentsAt, CONTENTS, readBsp } from "./bsp.mjs";
import { valueOf, vectorOf } from "./entities.mjs";

/** Half-Life's PLAYER_MAX_SAFE_FALL_SPEED (580) under sv_gravity 800: the drop that starts to hurt, in units. */
export const SAFE_DROP = Math.round((580 * 580) / (2 * 800));
/** A light this far from anything solid in every direction hangs in the air. */
export const LIGHT_REACH = 32;
/** The classes that light the map from where they stand. */
const LIGHTS = ["light", "light_spot"];
/** Where a body's chest is over the floor: open there, a player walks off the edge. */
const CHEST = 36;

/** The drops that hurt and the lights in mid-air of a compiled map (bytes or as `readBsp` gives it). */
export function sweepOf(bytes, { reach = null } = {}) {
  const bsp = bytes instanceof Uint8Array ? readBsp(Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength)) : bytes;
  const walk = reach ?? reachOf(bsp);
  const cell = walk.cell;
  const solid = (p) => contentsAt(bsp, p) === CONTENTS.SOLID;
  const { mins, maxs } = bsp.models[0];

  // every walked floor, cell by cell, each storey of it
  const drops = [];
  const seen = new Set();
  for (let x = Math.floor(mins[0] / cell) * cell; x <= maxs[0]; x += cell)
    for (let y = Math.floor(mins[1] / cell) * cell; y <= maxs[1]; y += cell) {
      let under;
      for (let storey = 0; storey < 8; storey++) {
        const h = walk.walked(x, y, under);
        if (h === null || h === undefined) break;
        under = h - 40;
        for (const [dx, dy] of [[cell, 0], [-cell, 0], [0, cell], [0, -cell]]) {
          const [nx, ny] = [x + dx, y + dy];
          // open at the chest beside it, and no floor there within a step: the edge
          if (solid([nx, ny, h + CHEST])) continue;
          const there = walk.stands(nx, ny, h + 18);
          if (there !== null && there !== undefined && there >= h - 18) continue;
          const landed = there ?? lowestOpenFloor(solid, nx, ny, h, mins[2]);
          if (landed === null || h - landed <= SAFE_DROP) continue;
          const key = `${Math.round(x / 64)},${Math.round(y / 64)},${Math.round(h / 64)}`;
          if (seen.has(key)) continue;
          seen.add(key);
          drops.push({ at: [x, y, Math.round(h)], to: [nx, ny, Math.round(landed)], fall: Math.round(h - landed) });
        }
      }
    }
  drops.sort((a, b) => b.fall - a.fall);

  const floating = [];
  bsp.entities.forEach((entity, number) => {
    if (!LIGHTS.includes(valueOf(entity, "classname"))) return;
    const o = vectorOf(entity, "origin");
    if (!o) return;
    const near = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]].some((d) => {
      for (let t = 2; t <= LIGHT_REACH; t += 2) if (solid([o[0] + d[0] * t, o[1] + d[1] * t, o[2] + d[2] * t])) return true;
      return false;
    });
    if (!near) floating.push({ number, classname: valueOf(entity, "classname"), at: o.map(Math.round) });
  });

  const facts = [
    `${drops.length} places a player can step off and fall more than ${SAFE_DROP} (hurt)${drops.length ? `: ${drops.slice(0, 6).map((d) => `${d.fall} down at ${d.at.join(" ")}`).join("; ")}` : ""}`,
    `${floating.length} lights with nothing solid within ${LIGHT_REACH} of them${floating.length ? `: ${floating.slice(0, 8).map((f) => `${f.number} at ${f.at.join(" ")}`).join("; ")}` : ""}`,
  ];
  return { drops, floating, facts };
}

/** The highest floor under a point a body would land on, found by going down through open space; null: none. */
function lowestOpenFloor(solid, x, y, from, bottom) {
  for (let z = from; z > bottom; z -= 4) if (solid([x, y, z - 4])) return z;
  return null;
}
