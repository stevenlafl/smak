# Sprite layers, round 2: what was built and what it moved

Written 2026-10-14. Build list items 4, 6 (sprites) and 9 of `research/asset-reproduction-failures.md`: the fill
options on the existing layers, the `blast` and `muzzle` ramps, the judge's measures against a reference sheet
in the build report, and the `billow` and `blobs` layers. Valve's sprites in
`~/.steam/steam/steamapps/common/Half-Life/valve/sprites` were read in place with the kit's readers and never
copied: only numbers (colour stops, measures) came out of them. The judge was not rerun; every number below is
the harness's own measure (`measureSpriteCopy` in `examples/reproduce/assets.mjs`).

## What was built

| Where | What |
| --- | --- |
| `src/sprite/effects.mjs`, `glow` | `falloff: "power"`: `1 / (1 + (r / core)^power)` (`power` 2) eased to nothing only at `reach` (1.5, past a square frame's corner). `smooth`, the old cut, stays the default |
| `flare` | per streak or for all: `taper` (wider toward its middle: a wedge), `blur` (a Gaussian across, `width / hypot(width, blur)` keeps the light), `haze` (a glow four times as wide under the arm), `half` (out from the core only), `gain`; `rays: { count, length, jitter, width, gain }`: seeded half streaks |
| `beam` | `profile: "flat"` with `shoulder`; `streaks`: fbm eight cells across the width and two along the frame, periodic along it, so a beam still tiles end to end |
| `fire` | `taper` (0.65 as before; 0 no cone); `tongues`: fbm four times as tall as wide, rising at the flame's own speed, cut at a level that climbs with height |
| ramps | `blast` and `muzzle`, from the mean colour of zerogxplode and muzzleflash1 at each tenth of brightness (table below). `glow`, `flare`, `beam` and `blobs` take a `ramp` too: the layer's brightness through it |
| `billow` | spheres (24) placed by seed, grown, risen and drifted; their fronts joined by a smooth maximum (`blend`), radius displaced by one fbm field (`lumps`), the surface's normal by finite differences, lit from the top left (`shade = 0.4 + 0.9 n.L`), heat times shade through the ramp, a white middle early (`hot`), `dissolve` (fbm cut at `dissolve * p^2.5`, turned off the grid), `debris` (the existing `sparks`, short trails). Under index alpha, coverage = cover x (0.6 + 0.4 shade) |
| `blobs` | soft discs re-placed from the seed every frame round a Gaussian core; the frame number reaches the layers for it |
| `src/sprite/measure.mjs` | `measureSheet(picture, { size, format, cols, cell, tint })`: dark share, border, frame count and mean Lab read off a contact sheet; `meanLab` |
| `src/spec/sprite.mjs` | `reference: "path"` or `{ picture, cell, cols }`: the report gives the judge's measures of the reference and of this sprite, each read off a sheet drawn the same way, with notes past the bars (delta E 15, dark 0.05, frame count). `buildSpriteSpec(spec, { readPicture })`; without it the path is read from disk |
| `src/sprite/draw.mjs` | `DARK`, `GREY` and `cellOf` exported for the sheet reader |
| docs | `docs/SPEC.md` "A sprite" (a layer table, the ramps, `reference`), `docs/API.md` "Sprites" |
| `test/51-sprite-layers.mjs` | 8 cases: defaults unchanged, no hard cut, wedge, blur, haze, half, rays, flat beam that tiles, fire with no cone and tongues that still loops, billow, blobs, the reference |

Every round-1 spec (16 legs) and the doc's example build byte for byte as before: the sha1 of each file was
taken before the first edit and compared after every change.

### The ramps' stops (numbers measured, not pixels)

Mean colour of each tenth of brightness over all lit pixels of all frames, each stop placed at the brightness
of its colour.

| zerogxplode (`blast`) brightness | r, g, b | muzzleflash1 (`muzzle`) brightness | r, g, b |
| --- | --- | --- | --- |
| 0.06 | 0.15 0.02 0.01 | 0.06 | 0.09 0.05 0.02 |
| 0.15 | 0.27 0.11 0.03 | 0.15 | 0.21 0.13 0.06 |
| 0.25 | 0.41 0.20 0.05 | 0.35 | 0.48 0.31 0.18 |
| 0.45 | 0.61 0.42 0.15 | 0.55 | 0.72 0.50 0.31 |
| 0.60 | 0.72 0.56 0.23 | 0.75 | 0.91 0.72 0.51 |
| 0.75 | 0.86 0.76 0.46 | 0.86 | 0.96 0.83 0.65 |
| 0.85 | 0.94 0.85 0.61 | 0.96 | 0.98 0.96 0.87 |
| 0.96 | 0.99 0.97 0.85 | | |

xspark1, measured the same way, runs (0.14: 0.03 0.18 0.25), (0.35: 0.09 0.43 0.58), (0.55: 0.18 0.67 0.87),
(0.75: 0.31 0.93 0.99), (0.85: 0.51 1 1), (1: 0.93 1 1). It was given as stops in its spec, not as a named
ramp, since the build list named two.

## Experiment 1: round 1's specs with only the new options

Each spec of round 1 (`examples/reproduce/assets/sprites/<id>/<leg>/spec.json`) built as it was (before) and
with only new fields added (after), measured against Valve's file by `measureSpriteCopy`. The changes:

| Sprite | Added to both legs' specs |
| --- | --- |
| fire | the fire layer: `taper: 0, tongues: 0.5` |
| flare1 | every glow: `falloff: "power", reach: 1.15`; the flare: `rays: { count: 96, length: 0.95 }` |
| laserbeam | every beam: `profile: "flat", shoulder: 0.35, streaks: 0.8` |
| muzzleflash1 | every flare: `taper: 1.5, blur: 0.04, haze: 0.05`. The words leg has no flare layer (its arms are 100 glow beads): nothing applies, and a `ramp` on its glows made it worse (delta E 37 to 48), so it is unchanged |

The bars are the research's: dark share within 0.05 of the original, delta E 15 or under.

| Sprite | Leg | Dark: Valve | before | after | Border max: Valve | before | after | Border mean: Valve | before | after | Delta E before | after |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| fire | pictures | 0.42 | 0.65 | 0.62 | 0.275 | 0.071 | 0.060 | 0.028 | 0.002 | 0.002 | 6.8 | 4.3 |
| fire | words | 0.42 | 0.74 | 0.70 | 0.275 | 0.009 | 0 | 0.028 | 0 | 0 | 12.5 | 4.1 |
| flare1 | pictures | 0.39 | 0.48 | **0.35** | 0 | 0 | 0 | 0 | 0 | 0 | 8.2 | 8.9 |
| flare1 | words | 0.39 | 0.53 | **0.46** | 0 | 0 | 0 | 0 | 0 | 0 | 19.6 | **13.1** |
| laserbeam | pictures | 0.02 | 0.44 | **0.07** | 1 | 1 | 1 | 0.261 | 0.102 | 0.236 | 14.1 | **1.6** |
| laserbeam | words | 0.02 | 0.40 | **0.07** | 1 | 1 | 1 | 0.261 | 0.102 | 0.243 | 14.9 | **1.5** |
| muzzleflash1 | pictures | 0.76 | 0.82 | 0.49 | 0.02 | 0 | 0 | 0 | 0 | 0 | 26.3 | **13.3** |
| muzzleflash1 | words | 0.76 | 0.86 | 0.86 | 0.02 | 0 | 0 | 0 | 0 | 0 | 37.2 | 37.2 |

Read with the sheets (looked at, each one):

- **laserbeam**: the clear win. A white flat core and grey streaky sides to the edge, as Valve's; dark from 0.44
  to 0.07 (the rest is the 2 pixel side fade, `finish.edge`, an old field), delta E 14 to 1.6.
- **flare1**: the fine rays are there and the glow fills to the corners' edge with no ring. Dark is now steered
  by `reach`: 1.0 gave 0.49 and 0.52, 1.15 gave 0.35 and 0.46, 1.25 gave 0.27 and 0.39. One value does not fit
  both legs because their glows' gains were tuned against the old cut.
- **fire**: no cone and licks with dark between them; delta E down on both legs. Dark only moved 0.03 to 0.04:
  the heat still falls with height (`(1 - h)^1.2 - 0.25 h`), so the top third stays dark where Valve's licks
  reach the top. That fall is not a new option and was left; it is the next thing to open (a `height` of 2.5 or
  more on these specs, or a heat that falls less).
- **muzzleflash1 pictures**: arms are wedges now and delta E halves, but dark overshoots (0.49 against 0.76).
  The spec gives colours in 0 to 255 with `gain: 0.012`, so any faint haze becomes visible, and its arms are
  two-sided streaks centred mid-arm, so a taper makes lens shapes, not wedges from the core. A spec written
  for the new options does well: one flare, five `half` streaks, `ramp: "muzzle"`, `taper: 1.5, blur: 0.03,
  haze: 0.03, gain: 0.8` measures dark 0.71, border 0, delta E 5.0, frame-mask overlap 0.65, and reads as tan
  wedges with a soft haze. That spec is in "Experiment 2".

On the judge's R2 ("fill") the expected movers are laserbeam (both legs within the dark bar) and flare1
(pictures within it, words 0.07 off). Fire and muzzleflash1 are still outside the dark bar. Whether the judge
agrees needs the judge rerun on these 8 legs (not done here).

## Experiment 2: billow and blobs, tuned

Specs written fresh with the new layers, measured as above, plus the envelope's peak, jitter, and a
frame-mask overlap: per frame, the share of pixels lit (energy over 0.03) in both, over those lit in either,
averaged (frames paired by their place in the run). Round 1's specs are measured the same way for comparison.

| Sprite | Spec | Delta E | Dark (Valve) | Border max (Valve) | Peak at (Valve) | Jitter (Valve) | Overlap |
| --- | --- | --- | --- | --- | --- | --- | --- |
| zerogxplode | round 1 pictures | 12.5 | 0.67 (0.73) | 0.048 (0.818) | 0.57 (0.36) | 1.16 (1.25) | 0.43 |
| zerogxplode | round 1 words | 29.8 | 0.94 | 0 | 0.40 | 1.29 | 0.18 |
| zerogxplode | **billow** | **5.1** | **0.75** | 0.051 | **0.36** | 1.39 | **0.49** |
| steam1 | round 1 pictures | 3.0 | 0.60 (0.64) | 0.251 (0.341) | 0.40 (0.40) | 1.20 (1.10) | 0.54 |
| steam1 | round 1 words | 5.2 | 0.60 | 0.188 | 0.47 | 1.10 | 0.52 |
| steam1 | **billow** | 5.0 | **0.65** | 0.565 | 0.47 | 1.19 | 0.51 |
| xspark1 | round 1 pictures | 9.0 | 0.49 (0.46) | 0.097 (0.145) | 0.50 (1.0) | 1.63 (1.51) | 0.77 |
| xspark1 | round 1 words | 4.6 | 0.49 | 0 | 0.45 | 0.70 | 0.74 |
| xspark1 | **blobs** | 4.8 | 0.53 | 0.056 | 0 | 1.77 | 0.75 |
| muzzleflash1 | **flare, rewritten** | 5.0 | 0.71 (0.76) | 0 (0.02) | | | 0.65 |

The specs (one layer each, all else default):

```json
zerogxplode: { "size": [64, 64], "frames": 15, "class": "explosion", "use": "tempent",
  "layers": [{ "kind": "billow", "at": [0.05, -0.05], "debris": { "count": 12 }, "env": { "decay": 0.3 } }] }
steam1: { "size": [32, 48], "frames": 16, "class": "smoke puff", "type": "parallel oriented", "format": "index alpha",
  "layers": [{ "kind": "billow", "at": [0, -0.35], "size": 0.3, "spread": 0.35, "rise": 0.6, "drift": 0.1,
    "dissolve": 0.6, "hot": 0, "env": { "decay": 0.5 } }] }
xspark1: { "size": [32, 32], "frames": 11, "use": "tempent",
  "layers": [{ "kind": "blobs", "ramp": [[0, [0, 0, 0]], [0.14, [0.03, 0.18, 0.25]], [0.35, [0.09, 0.43, 0.58]],
    [0.55, [0.18, 0.67, 0.87]], [0.75, [0.31, 0.93, 0.99]], [0.85, [0.51, 1, 1]], [1, [0.93, 1, 1]]] }] }
muzzleflash1: { "size": [64, 64], "frames": 2, "class": "flare", "use": "tempent",
  "layers": [{ "kind": "flare", "ramp": "muzzle", "core": 0.1, "taper": 1.5, "blur": 0.03, "haze": 0.03, "gain": 0.8,
    "streaks": [90, 18, -54, -126, 162] as { "angle": a, "length": 0.85, "width": 0.035, "half": true } }] }
```

How the tuning went, so the defaults can be judged:

- **zerogxplode.** The research's prototype (12 spheres) and my first try (40 small spheres, 0.13 each) read
  as a cluster of separate balls in the middle of the frame: dark 0.94, overlap 0.17. Fewer, larger spheres
  (24 at 0.3, spread 0.5), a growth curve that reaches three quarters by a third of the life (`1 - (1 - p)^4`;
  Valve's is near full by frame 4 of 15), and a smooth union of the fronts instead of the front-most sphere
  alone (the balls' creases went away) gave the table's row. These are now the defaults. The dissolve at
  `p^1.5` punched holes in the middle of the cloud by frame 7; at `p^2.5` it starts at about frame 10, as
  Valve's thinning does. The sheet reads as a lit, lumpy billow, white then cream, tan and dimmer brown, with
  flecks. Still different from Valve's: its cloud is two lobes, upper lit and lower in brown shadow, and its
  first frames are smaller and brighter.
- **steam1.** The billow under index alpha keeps its shading in coverage and grows and fades at about the right
  times, but it does not thin into Valve's column of wisps: the dissolve eats it everywhere at once. Overlap is
  no better than round 1 (0.51 against 0.54 and 0.52); its top touches the frame's top (border max 0.565). A
  dissolve that spares a column, or spheres that rise more the later they are, would be the next try.
- **xspark1.** The blobs match the flicker (jitter 1.77, Valve 1.51, sparks class 1.72 to 2.0) and colour (4.8)
  with the measured stops. Overlap is the same as round 1's (0.75 against 0.77 and 0.74): round 1's glows were
  already the right size. Valve's outer blobs show their edges; ours are softer. Its blobs at full strength
  summed to white everywhere, so each disc is now 0.15 to 0.5 of full and the core a Gaussian that falls to
  nothing (with the old `1 / (1 + r^2)` core the whole frame was lit, dark 0.25).

The overlap measure does not separate a good look from a bad one well (research section 10 said so too): the
40-sphere billow and the tuned one differ by 0.32 in overlap but the round-1 radial ball scores 0.43 with no
lighting at all. Delta E and dark share moved more and agree with what the sheets show.

## Measures against a reference sheet

`measureSheet` read on Valve's own sheets (`examples/reproduce/assets/sprites/<id>/input/frames.png`) against
`measureSprite` on the file itself, to show the reader finds the frames:

| Sprite | Frames (file, sheet) | Dark (file, sheet) | Border max (file, sheet) |
| --- | --- | --- | --- |
| glow01 | 1, 1 | 0.47, 0.47 | 0, 0 |
| flare1 | 1, 1 | 0.39, 0.39 | 0, 0 |
| fire | 15, 15 | 0.42, 0.38 | 0.275, 0.275 |
| zerogxplode | 15, 15 | 0.73, 0.72 | 0.818, 0.818 |
| steam1 (index alpha) | 16, 16 | 0.64, 0.63 | 0.341, 0.341 |
| xspark1 | 11, 11 | 0.46, 0.46 | 0.145, 0.145 |
| laserbeam | 1, 1 | 0.02, 0.02 | 1, 0.914 |
| muzzleflash1 | 2, 2 | 0.76, 0.76 | 0.02, 0.02 |

A cell is `size x k` where `k = floor(cell / longer side)`, not the `cell` square: a 32x96 frame at cell 128
is 32x96. That is why the research's read-back did not line up for fire (section 10). Each frame's number
hides a band in its top left (about 22x18 sheet pixels), which the reader leaves out; on fire's 32-wide
frames it is a large share, hence 0.38 against 0.42. The delta E the build reports equals the harness's
(fire 4.3, zerogxplode 5.1, steam1 5.0, laserbeam 1.6 in both). The reference changes nothing that is made: a
test builds a sprite with and without one and compares the bytes.

## What I could not do

- Rerun the judge. Every result is the harness's measures and my reading of the sheets.
- Close fire's dark share and top: needs the heat-with-height fall opened, which is not one of the new options.
- steam1's column of wisps (above).
- Wire `readPicture` into the MCP server: `mcp/tools.mjs` was outside what I was given to touch. As it is, the
  build reads `reference` as a path on disk (absolute, or from the server's working folder). For the agent's
  `pictures/frames.png` the server needs one line: `buildSpriteSpec(spec, { readPicture: (name) =>
  smak.unpng(readFileSync(pathOf(folders, name))) })`, as `buildModelSpec` is given.
- The overlap metric is a weak shape measure (above); a better one was not built.
