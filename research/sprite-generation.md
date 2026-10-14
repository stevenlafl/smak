# Sprites from a spec: the format, how the engines draw them, how to make and check them without eyes

Research for SMAK, 2026-10-14. The question: can the kit make GoldSrc sprites (`.spr`), still and
animated (muzzle flashes, explosions, smoke, glows, fire, sparks, beams, HUD icons, particle and decal-like
effects, the sprites `env_sprite` and `env_glow` show in a map) from a JSON spec an agent writes, in plain
JavaScript with no dependency. And how does the agent, who cannot watch an animation, tell whether what it
made is any good.

Abbreviations: SDK (software development kit: here Valve's Half-Life SDK), FWGS (Xash3D's "Flying With
Gauss" fork, the maintained open engine), GL (OpenGL), HUD (heads-up display), FPS (frames per second),
RGB (red, green, blue), PNG / APNG (Portable Network Graphics / its animated form), MCP (Model Context
Protocol), SD (Stable Diffusion), ROCm (AMD's GPU compute stack), GPU (graphics processor), FGD (Forge game
data, the entity list an editor reads), VDC (Valve Developer Community wiki).

Primary sources read for this, all on this machine:

| Source | Where | Version |
| --- | --- | --- |
| Half-Life SDK `utils/sprgen/spritegn.h`, `sprgen.c` (Valve's sprite compiler) | `/media/Data3/Packages/hlsdk` | alliedmodders/hlsdk `a0edb77` (2013) |
| SDK game code: `dlls/effects.cpp` (`env_sprite`), `dlls/ggrenade.cpp`, `cl_dll/*.cpp` | same; and `~/Packages/halflife-updated/cl_dll/entity.cpp` | |
| Xash3D FWGS: `engine/sprite.h`, `engine/common/mod_sprite.c`, `engine/client/cl_sprite.c`, `ref/gl/gl_sprite.c`, `ref/gl/gl_beams.c`, `engine/client/cl_tent.c`, `engine/common/imagelib/img_utils.c`, `img_wad.c` | `~/Packages/xash3d-fwgs` | `abf185e5` (2026-05-18) |
| The kit's reader and map drawing of sprites | `src/maps/sprites.mjs` | this repo, `135a793` |
| Half-Life's own sprites and maps, measured, never copied | `~/.steam/steam/steamapps/common/Half-Life/valve/sprites`, `.../valve/maps` | Steam build on this machine |

GoldSrc itself is closed. Everything said below about how a sprite is drawn is from Xash's code, from
Valve's SDK (game and client code, which is open) and from what Half-Life's own files show; section 10
lists what that leaves unverified for GoldSrc.

## 1. Summary

1. **The format is small and fully known.** A 40-byte header, a 256-colour palette, then frames, each a
   16-byte header and one palette index a pixel. Writing it is about 30 lines (section 7 has a working
   writer). The kit already reads it (`readSpr` in `src/maps/sprites.mjs`) and draws an entity's first frame
   in map views; the writer, the palette work, the frame generators and the checks are what is new.
2. **The file's texture format only says how the palette is read; the entity's render mode says how it is
   blended.** In Xash an `additive` sprite drawn in render mode Normal is an opaque square with a black
   ground. Half-Life's maps pair additive sprites with Glow (3) or Additive (5) every time (1,586 and 740
   entities), index-alpha ones with Solid (4) or Additive, alpha-test ones with Normal (0). The spec must
   choose the two together.
3. **Half-Life's own sprites set the targets.** 170 sprites in `valve/sprites`: 140 additive, 18 alpha
   test, 11 index alpha, 1 normal; 164 of the "parallel" type; every frame a multiple of 8 on each side
   (36 are not powers of two: 80x80, 80x96, 56x56); effects at 16 to 96 pixels, mostly 64x64 and 32x32;
   89 animated with 2 to 31 frames (median 14); every file has 256 palette colours, sync type "random",
   beam length 0, and no frame groups.
4. **Looping has an exact rule, the same as the kit's studio loops: write the loop's first frame again at
   the end.** `env_sprite` animates on the server, ten thinks a second, and wraps its frame number by
   `fmod(frame, frames - 1)`; client-side temporary entities wrap when the frame reaches `frames - 1`.
   Either way the last frame stands for the first. `env_sprite` changes frame at most 10 times a second
   (the server thinks every 0.1 s), whatever its `framerate`; a muzzle flash or explosion (a temporary
   entity) animates every rendered frame.
5. **Pictures can be made procedurally, in plain JavaScript, fast.** A prototype made a glow, a looping
   flame, a one-shot fireball, sparks, a beam and a smoke puff from Stam's stable-fluids solver, wrote
   them as `.spr`, read them back with the kit's reader and measured them: 2 to 280 ms each, quantisation
   error under 0.003 (energy, 0 to 1).
6. **Checking without eyes works with five numbers and a contact sheet**: the step the engine shows when
   it wraps a loop, measured against the mean step between frames ("wrap ratio": 1.17 for the periodic
   flame, 2.41 for the same flame with time not made periodic; Half-Life's loops 0.94 to 2.48 measured the same way); frame-to-frame
   jitter (a second difference over a first: 0.85 for the fireball, Half-Life's explosions 1.04 to 1.48);
   light on the frame's border (a lit border shows the square); the brightness envelope (where it peaks,
   how dark it starts and ends); and the share of black. The metrics caught both faults the first
   prototype had (a flame cut by its bottom edge, a smoke puff hitting the top and never ending) in the
   first run's numbers; the contact sheets then confirmed them.
7. **An image model adds little at sprite size.** SD-Turbo on this machine's GPU (ROCm), image-to-image over
   the procedural fireball's frames with one seed for every frame, took about 1 s a frame. At strength 0.5
   it added flame detail and raised jitter only from 0.85 to 0.94, but it lit the two frames that must be
   black (7% of the peak's brightness) and lifted the border. At 64 pixels the gain does not pay for a
   Python and GPU dependency; it belongs outside the kit, as `local-3d` is.
8. **The design** is a `smak.sprite/1` spec of layers (glow, flare, fire, smoke, explosion, sparks, ring,
   beam, picture), like the sound spec; a builder that writes the file, a report with the numbers against
   Half-Life's sprites of the same kind, and a contact sheet; a map spec field `sprites` that places
   `env_sprite` and `env_glow` with their render settings; and the existing MCP `build` tool taking the new
   spec. Section 9 is the build list.

## 2. The file

### 2.1 Layout

From `spritegn.h` and `sprgen.c` `WriteSprite` (Valve), checked against Xash's `dsprite_hl_t`
(`engine/sprite.h`, `STATIC_CHECK_SIZEOF( dsprite_hl_t, 40, 40 )`) and against every Half-Life file read.
All numbers little-endian.

| Offset | Field (SDK name) | Type | What to write |
| --- | --- | --- | --- |
| 0 | `ident` | 4 bytes | `IDSP` |
| 4 | `version` | int32 | 2 (1 is Quake's; Xash also reads 32, its own 32-bit colour sprites) |
| 8 | `type` | int32 | 0 parallel upright, 1 facing upright, 2 parallel, 3 oriented, 4 parallel oriented (section 3.1) |
| 12 | `texFormat` | int32 | 0 normal, 1 additive, 2 index alpha, 3 alpha test (section 3.2) |
| 16 | `boundingradius` | float32 | `sqrt((w/2)^2 + (h/2)^2)` of the largest frame, as sprgen does. Xash reads the word as an int32 and uses it for nothing visible |
| 20, 24 | `width`, `height` | int32 | the largest frame's size. Xash makes the cull box from these: `mins = -w/2`, `maxs = w/2` (times the entity's scale) |
| 28 | `numframes` | int32 | frames, a group counting as one |
| 32 | `beamlength` | float32 | 0. Every Half-Life file has 0. Xash reads this word as `facetype`: 1 draws an oriented sprite from both sides, 0 from the front only |
| 36 | `synctype` | int32 | 1 (random), as sprgen writes unless told `$sync` and as every Half-Life file has. Xash reads it and never uses it |
| 40 | palette count | int16 | 256. sprgen always writes 256; Xash refuses more than 256 |
| 42 | palette | count x 3 bytes | RGB |
| then, `numframes` times | frame type | int32 | 0 a single frame, 1 a group (Xash adds 2, "angled", eight views) |

A single frame: a 16-byte header `{ origin[2], width, height }` (int32 each) then `width x height` palette
indices, rows top to bottom. `origin[0]` is where the frame's left edge is from the entity's origin and
`origin[1]` where its top is, in pixels: sprgen writes `-(w >> 1)` and `h >> 1` (centred) unless told
otherwise, and Xash makes `left = origin[0]`, `right = origin[0] + width`, `up = origin[1]`,
`down = origin[1] - height`. A flame whose base is the entity's origin has `origin = [-w/2, h]`.

A group: `numframes` (int32), then that many float32 **cumulative** end times (sprgen adds each frame's
interval to a running total, default 0.1 s), then that many frames, each with its 16-byte header and no
frame type before it. The engine picks a group's frame from the client's clock (section 3.3).

### 2.2 What sprgen required, and what the files show

| Rule | sprgen (`sprgen.c`) | Half-Life's files | Comment |
| --- | --- | --- | --- |
| Frame side a multiple of 8 | refused otherwise ("Sprite dimensions not multiples of 8") | all 170 + 214 HUD files | keep it: some tools still assume it |
| Frame side at most 256 | refused otherwise | 2560crosshairs.spr 384x384; `2560/` HUD sprites to 1024x256 (anniversary update) | GoldSrc's GL path shrinks over `gl_max_size` (512 since 2023, 256 before: docs/ENGINES.md). the303.org's guide gives 512x512 as the maximum |
| Power of two | not checked | 36 of 170 not (80x80, 80x96, 56x56 ...) | resampled to a power of two by GoldSrc's GL loader (docs/ENGINES.md): a little softer |
| One palette for all frames | refused otherwise ("doesn't share a pallette with the previous bitmap") | always | the palette is the file's, not the frame's |
| Frames | at most 1000 (`MAX_FRAMES`) | at most 31 | |

### 2.3 What the kit already has

`src/maps/sprites.mjs` reads a sprite (`readSpr`: type, format, palette, frames with their origins and
pixels; groups flattened), finds the sprites a map's entities name, and makes each into a board for the map
drawing, with the five types' axes, the render modes' blending, the colour, and a glow's distance scaling,
all ported from Xash's `gl_sprite.c`. To reuse for writing:

- `SPRITE_TYPES`, `SPRITE_FORMATS` and the header offsets: share them with the writer, so that reading and
  writing cannot drift apart.
- `readSpr` should also keep `radius`, `beamlength`/`facetype`, `synctype` and each group's intervals
  (today they are skipped), so that a written file can be checked field by field after a round trip.
- `boardOf` and the drawing's blend are already the "how does it look over the scene" step: a sprite placed
  in a map spec is drawn in the map's views with no new code.
- `indexed` (`src/image.mjs`, median cut) quantises one picture; quantising every frame stacked into one tall
  picture gives the one shared palette the format needs (section 5.5). `png`/`unpng` and the wad writer
  (`maps.writeWad`) cover the pictures and decals.

## 3. How the engines draw a sprite

### 3.1 The five types

From `gl_sprite.c` `R_DrawSpriteModel` (Xash), the same arithmetic as the kit's `boardOf`.

| Type | Board | For | Half-Life files |
| --- | --- | --- | --- |
| 2 parallel | faces the camera, the camera's own right and up | glows, explosions, flashes, smoke, HUD | 164 |
| 0 parallel upright | turns about the vertical to face the camera's direction; not drawn within 1 degree of straight up or down | flames, standing things | 0 |
| 1 facing upright | turns about the vertical to face the eye's position (not its direction) | the same, steadier when the eye moves sideways | 0 |
| 3 oriented | lies as the entity's angles say, pushed 0.01 along its forward to avoid fighting a wall | decal-like marks on walls, flat rings, signs | 1 (`oriented.spr`) |
| 4 parallel oriented | faces the camera, rolled by the entity's roll angle | rotating smoke, flames, explosions | 5 (`fire`, `smoke`, `steam1`, `explode2`, `vp_parallel_oriented`) |

A parallel sprite with a roll angle is drawn as parallel oriented: muzzle flashes are rolled at random this
way (`R_MuzzleFlash`, 0 to 359 degrees, or 0 to 20 for the rifle flash).

### 3.2 Texture format: how the palette is read

From `cl_sprite.c` `Mod_SpriteLoadTextures` and `img_utils.c` `Image_SetPalette` (Xash):

| Format | Colour of index i | Alpha of index i | Half-Life's convention |
| --- | --- | --- | --- |
| normal (0) | palette[i], gamma-corrected (`#texgamma.pal`) | 255 | 1 file (`lgtning.spr`, a beam) |
| additive (1) | palette[i], gamma-corrected | 255 | black adds nothing: black is the "transparent" colour. 52 of 140 keep pure black at index 0 with the palette sorted dark to bright (glows, beams, HUD); 64 keep black at 255 with the palette in no order (most rendered explosion and fire sequences) |
| index alpha (2) | palette[255] for every index (`#gradient.pal`) | i | the index is the coverage, 0 clear to 255 solid; the colour is the last palette entry (`steam1` white, `bigspit` [123,138,1]). The entity's `rendercolor` tints it |
| alpha test (3) | palette[i] | 0 at index 255, else 255 (`#masked.pal`) | a hole where the index is 255; blood, HUD crosshairs, player icons |

Decals are not sprites but use the same idea: a decal in `decals.wad` is a gradient (index is alpha,
colour the last palette entry) unless its last palette entry is pure blue, when index 255 is a hole
(`img_wad.c`). So the index-alpha pipeline also makes decals, written with the kit's wad writer.

### 3.3 Render mode: how it is blended

The entity's `rendermode` decides the blend (`R_DrawSpriteModel`):

| Mode (number, Hammer's name) | GL blend | Depth | Use |
| --- | --- | --- | --- |
| 0 Normal | none (alpha test only) | written | alpha-test sprites; an additive sprite here is a square with a black ground |
| 1 Color, 2 Texture | src alpha, 1 - src alpha; `renderamt` is the alpha | tested | translucent pictures |
| 4 Solid (TransAlpha) | the same, depth not written | tested | index-alpha smoke (`steam1` x 22 in the maps) |
| 5 Additive | src alpha, one | tested, not written | fire, explosions, flares |
| 3 Glow | src alpha, one | **not tested**: drawn over everything when a trace from the eye reaches it | `env_glow`, lamp halos |

Glow mode also scales the sprite by `distance / 200` and dims it by `19000 / distance^2` (clamped 0.05 to 1),
unless `renderfx` is 14 (No dissipation: 838 of Half-Life's map entities set it). `rendercolor` of `0 0 0`
means "no tint" (Xash's comment calls it a Hammer bug). Xash also lerps between frames of an additive sprite
in a blending mode (`r_sprite_lerping`), and lights alpha-test sprites by the light at their origin
(`r_sprite_lighting`); neither is in GoldSrc as far as can be told.

Half-Life's maps (133 `.bsp`, 3,193 entities that name a sprite or draw a beam):

| | |
| --- | --- |
| Classes | `env_sprite` 1,442, `env_glow` 946, `env_beam` 725, `env_laser` 78, `cycler_sprite` 2 |
| `env_sprite` render modes | Additive (5) 740, Glow (3) 640, Normal (0) 42 (`agrunt1.spr` 36, alpha test; `XFlare3.spr` 6), Solid (4) 20 |
| `env_glow` render modes | Glow (3) 946 |
| Most used | `glow01.spr` 825, `lgtning.spr` 410, `flare1.spr` 326, `flare3.spr` 169, `laserbeam.spr` 164, `Fexplo1.spr` 145 |
| `framerate` | unset 1,190, 10 1,115, 0 626, 20 64, then 200, 40, 25, 30 |
| `scale` | unset 1,655, 1 427, 2 335, 0.35 120, 1.5 107, 1.2 99, up to 15 |
| `renderamt` | 255 944, then 192, 150, 100, 128, 200 |

### 3.4 Animation and looping

Three clocks, from the SDK's code:

| Who animates | Code | Rule | Consequence |
| --- | --- | --- | --- |
| `env_sprite` (server) | `CSprite::AnimateThink`, `Animate` (`dlls/effects.cpp`) | every 0.1 s: `frame += framerate * dt`; past `frames - 1` it becomes `fmod(frame, frames - 1)`, or with flag 2 ("Play once") the sprite turns off. It only animates with `framerate` set and more than two frames | at most 10 frame changes a second; a higher `framerate` skips frames. The loop runs over `frames - 1` steps: the last frame stands for the first |
| Temporary entities (client): muzzle flashes, explosions, sprite trails | `HUD_TempEntUpdate` (`cl_dll/entity.cpp`) with `FTENT_SPRANIMATE` | every rendered frame: `frame += framerate * frametime`; at `frame >= frames - 1` it keeps the fraction (loops) or dies | frames `0 .. frames - 2` are shown; the last never is. A one-shot explosion is played at the rate the server sends (`TE_EXPLOSION`'s byte; `ggrenade.cpp` sends 15) |
| A frame group (client) | `R_GetSpriteFrame` (`cl_sprite.c`, from Quake) | the frame whose cumulative interval covers `client time mod total` | animates by itself, at any rate, in step on every entity. Half-Life ships none; untested in GoldSrc |

So the rule for every loop is the one the kit already applies to studio animations: **make `P` distinct
frames whose cycle closes, and write `P + 1`, the last a copy of the first.** The303.org's sprite guide
reaches the same advice from practice ("the final frame should be added twice so the env_sprite loops
properly"; "set your animation framerate to a maximum of 10").

The engine's own effects set their render modes in code (`cl_tent.c`): muzzle flash Additive, amount 255,
scale `type / 10 * 0.1`; explosion Additive at amount 180 (unless flagged), its frame rate from the
message; `TE_GLOWSPRITE` Glow with No dissipation; `TE_SPRITE` Additive. A sprite that replaces one the
code uses keeps its name and inherits that mode.

### 3.5 Beams and HUD sprites

**Beams** (`env_beam`, `env_laser`, `TE_BEAMPOINTS`; `gl_beams.c` `R_DrawSegs`): the texture's `u` runs
across the beam (0 to 1 over its width) and `v` along it, one repeat of the picture every 100 units of
length, scrolled along `v`. So a beam picture is a strip whose columns are the beam's cross-section and
whose rows must **tile top to bottom**. Beams draw Additive unless flagged solid (`FBEAM_SOLID`), whatever
the sprite's format (the303.org: `env_laser` "renders only in additive mode, no matter the sprite format").
Half-Life's beams are 16x64 or 32x64.

**HUD sprites** are sheets cut into rectangles by `sprites/hud.txt` and `sprites/weapon_*.txt` (`name res
file x y w h`), drawn by the client mostly with `SPR_DrawAdditive` (`cl_dll/ammohistory.cpp`,
`battery.cpp`, `death.cpp`) and crosshairs with holes (alpha test). The anniversary build adds `1280/` and
`2560/` folders (107 sprites each, all additive, powers of two, up to 512x256 and 1024x256).

### 3.6 Edges

Xash uploads a world sprite's frames with no clamping flag (`r_texFlags = mod->numtexinfo`, 0 for world
sprites; only HUD sprites pass flags). With linear filtering and wrap-around addressing, a lit pixel on one
edge bleeds onto the opposite edge, and a picture that is lit at its border shows the square. Half-Life's
effects keep their borders dark: the mean energy of the outer two pixels is under 0.03 in all but two of the
74 animated sprites measured (`explode2` 0.55, `smoke` 0.11; section 6.2). Only beams (which must tile along their length) are lit to the
edge.

## 4. Half-Life's own sprites, measured

Script: section 7's `measure.mjs` over `valve/sprites` (read-only; nothing copied).

| | Count |
| --- | --- |
| `.spr` files in `valve/sprites` | 170 (and 107 in `1280/`, 107 in `2560/`) |
| Version | 2: all |
| Type | parallel 164, parallel oriented 5, oriented 1 |
| Format | additive 140, alpha test 18, index alpha 11, normal 1 |
| Palette colours | 256: all |
| Sync type | 1 (random): all |
| Beam length | 0: all |
| Frame groups | none |
| Frames | single 81; animated 89 (2 to 31, median 14) |
| Sides | multiples of 8: all; powers of two: 134; not: 36 |

Frame sizes of the effects (HUD, logo and crosshair sheets left out):

| Size | Files | Size | Files |
| --- | --- | --- | --- |
| 64x64 | 61 | 16x16 | 8 |
| 32x32 | 21 | 56x56, 96x96, 88x88, 80x96, 80x64 | 2 each |
| 32x64 | 13 | 64x80, 32x96, 64x96, 64x16, 32x16, 16x32, 8x64, 40x40, 8x8, 32x48 | 1 each |
| 80x80 | 12 | | |
| 16x64 | 12 | | |

Animated additive sprites use all 256 colours (median 255 used), and between 0 and 98% of their pixels are
dark (median 65%): an explosion is mostly black square.

Brightness envelopes (mean energy per frame, 0 to 1), a few by kind:

| Sprite | Frames | Shape |
| --- | --- | --- |
| `zerogxplode.spr` (the grenade) | 15 | 0.02, rises to 0.27 at frame 5 (peak at 36% of its length), falls to 0.01 |
| `fexplo.spr` | 30 | 0.00, 0.11 by frame 2, slow climb to 0.21 at 57%, to 0.00 |
| `steam1.spr` (index alpha) | 16 | 0.01, up to 0.32 at 40%, down to 0.01 |
| `fire.spr` (loop) | 15 | flat 0.14 to 0.18 |
| `xsmoke1.spr` (loop) | 15 | flat 0.25 |
| `muz1.spr` | 8 | 0.06, peak 0.15 at 57%, to 0 |

## 5. Making the pictures

Every method below makes frames in full colour (or coverage) first; quantising to the one palette comes
last (5.5).

### 5.1 Procedural, from noise

- **Noise.** Perlin, "An Image Synthesizer" (SIGGRAPH 1985) and "Improving Noise" (SIGGRAPH 2002): smooth
  lattice noise summed over octaves (fractional Brownian motion). The kit's `workshop` has value noise and
  `fbm`. For animation, noise is taken in one more dimension, time.
- **Exact loops.** Make the noise lattice periodic in time: hash the lattice coordinate modulo the period,
  so the noise at `t = P` is the noise at `t = 0`. Anything scrolled (a flame rising) must scroll a whole
  number of its own periods in one loop, so the lattice is made periodic along the scroll axis too. The
  prototype does both (section 7). The common alternative, sampling 4D noise along a circle in two extra
  dimensions, also closes but needs 4D noise; a crossfade of the last frames into the first closes anything
  but ghosts the picture for the crossfade's length.
- **Swirl and flow.** Domain warping (feeding noise into noise's coordinates; Iñigo Quilez's article
  "Domain warping", iquilezles.org) gives billows; Perlin and Neyret, "Flow Noise" (SIGGRAPH 2001 sketch),
  rotates the gradients over time for swirling motion that stays coherent; Bridson, Hourihan and
  Nordenstam, "Curl-Noise for Procedural Fluid Flow" (SIGGRAPH 2007), takes the curl of a noise field as a
  divergence-free velocity and advects particles or density through it: smoke-like motion with no solver.
- **Fire colour.** Map a scalar "heat" through a ramp from black through deep red and orange to pale yellow,
  the path of a heated body's colour; Nguyen, Fedkiw and Jensen, "Physically Based Modeling and Animation of
  Fire" (SIGGRAPH 2002), render it from blackbody radiation. For additive sprites the ramp must start at
  pure black, which is what makes cold regions vanish.
- **Shapes.** Radial glows (`a / (r^2 + a)` falloff with a soft clip to zero at the edge), lens flares (a
  glow plus thin streaks along chosen angles, `exp(-(d/w)^2)` across each), shock rings (a band in radius
  that grows and fades), spark streaks (ballistic particles drawn as short lines over their last few
  positions), beams (a Gaussian cross-section times noise that tiles along the length).

### 5.2 Simulation

- **Stable fluids.** Stam, "Stable Fluids" (SIGGRAPH 1999): semi-Lagrangian advection, implicit diffusion and
  a pressure projection, unconditionally stable; Stam, "Real-Time Fluid Dynamics for Games" (GDC 2003) gives
  the grid solver in about a page of C. The prototype ports it (about 40 lines of JavaScript): a 64x64 grid,
  48 steps, rendered to 16 frames of index alpha in 260 to 280 ms.
- **Vorticity confinement.** Fedkiw, Stam and Jensen, "Visual Simulation of Smoke" (SIGGRAPH 2001): adds
  back the small swirls numerical diffusion removes. The prototype has none and its smoke shows it (a smooth
  mushroom); this is the next thing to add if the solver is kept.
- **Limits for sprites.** A simulation does not loop by itself: a loop must be crossfaded or the simulation
  run to a periodic state. A one-shot (a puff, a burst) needs an envelope that brings it to nothing by its
  last frame (the prototype's first smoke ended at 69% of its peak and filled the frame to its top edge; the
  metrics said so). Simulated detail at 32x48 is mostly lost; it pays at 64 and above.
- **Cellular fire.** The demo-scene fire (each pixel the average of the ones below, minus a random decay;
  Fabien Sanglard, "How DOOM fire was done", 2018) is cheap and coherent, but does not loop and reads as
  "retro" at sprite sizes.

### 5.3 Shader-style recipes

Shadertoy and the demo scene have the same ingredients as 5.1 written as per-pixel functions of `(x, y, t)`:
noise, warps, polar coordinates, ramps. The kit's sprite builder is exactly that shape (a function of pixel
and time, sampled per frame), so a recipe from that world ports directly to a layer kind, with `t` made
periodic for loops. Nothing needs a GPU at 64x64 x 16 frames (65,536 samples).

### 5.4 Image models

`research/local-3d-generators.md` set up SD-Turbo (Sauer et al., "Adversarial Diffusion Distillation",
2023: one to four denoising steps) on this machine's RX 9070 XT through PyTorch's ROCm wheels. The obstacle
for sprites is time: each frame generated alone flickers. Known ways round it:

| Approach | Source | For sprites |
| --- | --- | --- |
| Image-to-image over procedural frames, same seed every frame | SDEdit (Meng et al., 2021): noise an input part way, denoise | tried here (section 7.3): coherent at low strength because the input carries the motion; small gain at 64 px; lights black frames |
| Video diffusion | AnimateDiff (Guo et al., 2023), Stable Video Diffusion (Blattmann et al., 2023) | temporally coherent, but loops are not built in, 8 to 16 GB VRAM class models, many seconds a clip; not tried |
| Seamless tiling | circular padding in the convolutions (a widely used trick) | for a beam's tiling strip; not tried |
| Looping | interpolate the latent along a closed path (spherical interpolation around a circle) | not tried |

The kit is dependency-free; a model belongs outside it as an optional pre-step that writes PNG frames,
which the kit's `picture` layer (section 8) then quantises and checks. The measurement in 7.3 says it is not
worth it for effects at Half-Life's sizes; it may be for 128 to 256 pixel HUD icons and pictures.

### 5.5 One palette for every frame

- **Shared.** Quantise all frames together (sprgen refuses frames with different palettes): stack them into
  one tall picture and run the kit's median cut (`indexed`; Heckbert, "Color Image Quantization for Frame
  Buffer Display", SIGGRAPH 1982). Wu's method (Graphics Gems II, 1991) or k-means refinement are better on
  smooth gradients if banding shows.
- **Additive.** Force near-black to pure black before quantising (any colour above black adds a faint
  square), keep one entry pure black, and sort the palette dark to bright with black at 0, as Half-Life's
  glows and beams do (an editor's tint and a person's eye can then read the ramp). No dithering: dither in an
  additive sprite is sparkle, and it costs nothing to leave out at 256 colours.
- **Index alpha.** No quantising at all: the index is `round(coverage x 255)`, the colour goes in palette
  entry 255, and entries 0 to 254 can be a grey ramp for editors. Tint with `rendercolor`.
- **Alpha test.** 255 colours by median cut over the solid pixels, index 255 for every pixel under half
  coverage (the kit's `masked` does this for textures).
- **Normal.** Plain median cut.

## 6. Measuring without eyes

### 6.1 The measures

Each frame is turned into "energy", what it lands on screen as the engine reads it: luminance for additive
and normal, coverage for index alpha, luminance where solid for alpha test (0 to 1 a pixel). Then:

| Measure | Definition | Says |
| --- | --- | --- |
| Wrap ratio | mean absolute difference between frame `n-2` and frame 0 (the step the engine shows at the wrap, section 3.4), over the mean step between consecutive frames | about 1: the loop closes as smoothly as it moves; well over 2.5: a visible jump |
| Jitter | mean `abs(f[t+1] - 2 f[t] + f[t-1])` over the mean `abs(f[t+1] - f[t])` | about 1.7 for unrelated frames (independent noise); lower when motion is coherent. A flicker index after the temporal-consistency measures of video work (Lai et al., "Learning Blind Video Temporal Consistency", ECCV 2018, measure warping error between frames) |
| Border | brightest pixel, and the mean, in the outer two pixels over all frames | a lit border shows the frame's square, and bleeds to the opposite edge (3.6) |
| Envelope | mean energy per frame; where it peaks (0 to 1 of the length), the first and last frames over the peak | a one-shot starts and ends dark; a loop is flat |
| Dark share | share of pixels under 0.03 | additive effects are mostly black |
| Quantisation error | mean energy difference before and after the palette | the palette lost too much |
| Colours used | of 256 | |

A contact sheet (frames in rows, each blended over a dark and over a mid grey the way the engine blends it)
is the picture the agent reads; an APNG (or the kit's viewer) plays it for the person.

### 6.2 Half-Life's ranges

From `hlmetrics.mjs` over the 74 animated sprites whose frames are all one size:

| Kind | Examples | Jitter | Wrap ratio | Border mean | Peak at | First / last over peak |
| --- | --- | --- | --- | --- | --- | --- |
| One-shot explosions | `zerogxplode`, `fexplo`, `fexplo1`, `cexplo`, `dexplo`, `eexplo`, `gexplo`, `bexplo`, `aexplo`, `WXplo1` | 1.04 to 1.48 | (not looped) | 0.000 to 0.005 | 0.22 to 0.71 | first 0.00 to 0.22, last 0.00 to 0.03 |
| Looping fire, smoke, portals | `fire`, `xsmoke1`, `xsmoke3`, `xssmke1`, `xspark1`, `flare6`, `enter1`, `exit1`, `tele1`, `e-tele1` | 1.33 to 1.79 | 0.94 to 2.48 | 0.000 to 0.028 | (flat) | 0.57 to 1.00 |
| Particles, drips, splashes | `xspark2`, `wsplash3`, `wdrip2`, `sdrip1` | 1.72 to 2.00 | | 0.000 to 0.001 | | |
| Index-alpha smoke | `steam1` | 1.11 | | 0.002 | 0.40 | 0.04 / 0.03 |

Jitter depends on the kind: particles are near 2 by their nature. Half-Life's loops were not all made with
the last frame standing for the first: measured from their last frame to their first instead, their seam
ratios are 0.51 to 1.95, lower than the wrap step the engine shows (0.94 to 2.48). So a wrap ratio up to
about 2.5 is within what the game ships; well over it is a jump. A spec's `class` should be held against
its own kind, as the sound spec does.

## 7. First experiment

Scripts (throwaway, `/tmp/claude-1000/sprites/`, not kept): `measure.mjs`, `parse.mjs`, `metrics.mjs`,
`hlmetrics.mjs`, `maps.mjs` (sections 4 and 6.2); `proto.mjs` (generators, quantiser, writer, contact
sheets); `dump.mjs`, `sd/img2img.py`, `sdmeasure.mjs` (7.3). They should be saved into
`research/sprite-bench/` when the build starts, as `research/compiler-bench/` was.

### 7.1 Method

Each generator made frames in floating point; the quantiser made the shared palette (additive: near-black
to black, 255 colours by `indexed` over the stacked frames, sorted dark to bright, black at 0; index alpha:
coverage to index); the writer wrote version 2 with sprgen's radius, beam length 0, sync 1, centred
origins. Each file was read back with the kit's own `maps.readSpr`, turned to energy as the engine reads
it, and measured.

### 7.2 Results

| Sprite | Format | Size | Frames | Bytes | Time (ms) | Colours | Quant. error | Jitter | Wrap ratio | Border max / mean | Peak at | First / last |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| glow | additive | 64x64 | 1 | 4,926 | 2 | 68 | 0.0023 | | | 0 / 0 | | |
| fire_loop (periodic) | additive | 32x64 | 16 + 1 | 35,966 | 45 | 154 | 0.0005 | 1.42 | **1.17** | 0.48 / 0.010 | | 0.95 / 0.95 |
| fire_noloop (time not periodic) | additive | 32x64 | 17 | 35,966 | 35 | 156 | 0.0005 | 1.44 | **2.41** | 0.42 / 0.008 | | 0.77 / 1.00 |
| explosion | additive | 64x64 | 16 | 66,666 | 75 | 142 | 0.0008 | 0.85 | | 0 / 0 | 0.27 | 0.00 / 0.00 |
| sparks | additive | 32x32 | 11 | 12,294 | 2 | 123 | 0.0000 | 2.06 | | 0 / 0 | 0.40 | 0.02 / 0.00 |
| beam | additive | 16x64 | 1 | 1,854 | 2 | 116 | 0.0019 | | | 0.95 / 0.049 (meant: it tiles) | | |
| smoke_fluid (first) | index alpha | 32x48 | 16 | 25,706 | 259 | 256 | 0.0004 | 1.60 | | **0.56** / 0.025 | 0.33 | 0.23 / **0.69** |
| smoke_fluid2 (fixed by the numbers) | index alpha | 32x48 | 16 | 25,706 | 273 | 171 | 0.0003 | 1.50 | | 0.13 / 0.002 | 0.20 | 0.30 / 0.28 |

What it showed:

- **The wrap ratio separates a loop from a non-loop**: 1.17 against 2.41 for the same flame. The first is
  well inside Half-Life's loops (0.94 to 2.48); the second is near their worst (`flare6`, 2.48), so the
  metric separates clearly in a controlled pair but a single threshold needs care.
- **The border caught a flame cut by the frame's bottom edge** (border max 0.95, mean 0.057 in the first
  run); fading the heat over the bottom six pixels brought the mean to 0.010, inside Half-Life's range,
  though the brightest border pixel (0.48) is still higher than any Half-Life loop's mean suggests is wise.
- **The envelope and border caught a smoke puff that hit the top and never ended** (last frame 69% of the
  peak, border 0.56). More dissipation, less injection and less lift brought them to 0.28 and 0.13; it
  still does not reach zero, which says a one-shot needs an explicit fade-out envelope, not only physics.
- **The fireball's envelope is Half-Life's shape** (dark start, peak at 27% of its length, dark end),
  jitter 0.85 (smoother than Half-Life's rendered explosions, 1.04 to 1.48: a plainer picture, which the
  contact sheet confirms: a soft blob with less internal structure than `fexplo`).
- The contact sheets (flame, fireball, glow) look like what they are meant to be at a glance; the fluid
  smoke looks like a mushroom with vertical streaks, which no number above says. The picture stays
  necessary.

### 7.3 SD-Turbo over the procedural frames

`sd/img2img.py` in the `local-3d` venv (`torch 2.9.1+rocm6.4`, SD-Turbo fp16): each 64x64 frame scaled to
512, image-to-image with prompt "a fiery explosion fireball, orange flames, on a pure black background",
seed 7 for every frame, then box-filtered back to 64x64.

| Frames | Time a frame | Jitter | Border mean | First / last over peak |
| --- | --- | --- | --- | --- |
| procedural explosion | | 0.85 | 0.000 | 0.00 / 0.00 |
| SD-Turbo, strength 0.25 (4 steps) | about 1 s | 0.86 | 0.004 | 0.07 / 0.07 |
| SD-Turbo, strength 0.5 (2 steps) | about 1 s | 0.94 | 0.007 | 0.07 / 0.07 |
| procedural flame loop: wrap ratio 1.17 | | 1.42 | 0.010 | |
| SD-Turbo over it, strength 0.5: wrap ratio 1.35 | 2.3 s (512x1024) | 1.35 | 0.018 | |

With the same seed each frame, coherence holds (the input carries the motion). It added some flame
structure inside the ball at strength 0.5. But it put light into the empty first and last frames, which an
additive sprite shows as a faint square, and lifted the border. Worth noting, not worth building in.

## 8. Design

### 8.1 The spec: `smak.sprite/1`

Shaped like the sound spec: one sprite, or a set (`sprites: [...]` with the spec's fields as defaults), made
of layers summed (additive) or laid over each other (coverage), each a kind with its parameters.

```json
{
  "spec": "smak.sprite/1",
  "name": "sprites/torch_flame.spr",
  "use": "env_sprite",
  "class": "fire loop",
  "size": [32, 64],
  "frames": 16,
  "loop": true,
  "fps": 10,
  "type": "parallel upright",
  "format": "additive",
  "origin": "bottom",
  "seed": 3,
  "layers": [
    { "id": "flame", "kind": "fire", "ramp": "fire", "width": 0.7, "rise": 1, "turbulence": 0.8 },
    { "id": "halo", "kind": "glow", "at": [0, 0.75], "radius": 0.5, "colour": [1, 0.6, 0.2], "gain": 0.35 }
  ],
  "finish": { "edge": 3, "gamma": 1.0 },
  "reference": "sprites/fire.spr"
}
```

| Field | |
| --- | --- |
| `name` | Path under the mod folder, `sprites/...spr`, lower case. A sprite the engine or game code loads by name (`sprites/muzzleflash1.spr`, `sprites/zerogxplode.spr`) keeps that name to replace it with no code |
| `use` | `env_sprite`, `env_glow`, `tempent` (muzzle flash, explosion, trail), `beam`, `hud`, `decal`. Decides the loop convention, the checks (fps over 10 for `env_sprite` is a warning; a beam must tile along its length and may be lit to its edges; a decal is written to a `.wad`), and the render mode the report suggests |
| `class` | What it is held against (section 6.2): `explosion`, `fire loop`, `smoke loop`, `smoke puff`, `sparks`, `flash`, `glow`, `flare`, `beam`, `ring`, `icon` |
| `size` | `[w, h]`, multiples of 8 (powers of two unless told), 256 at most unless told (512 hard limit) |
| `frames`, `loop`, `fps` | A loop of `frames` distinct frames is written with the first again at the end (3.4); `fps` becomes the suggested `framerate` |
| `type`, `format` | As 3.1 and 3.2. Defaults: `parallel`, `additive` |
| `origin` | `centre`, `bottom` (a flame on its base), or `[x, y]` pixels |
| `layers` | Each `{ id, kind, gain, blend, at, ...kind's fields, env }`. `env`: an envelope over the frames (`{ attack, peak, decay }` as shares of the length, or points), which makes a one-shot start and end at nothing |
| `finish` | `edge` (pixels faded to black or clear at the border, 2 unless the use is a beam), `gamma`, `palette` (`auto` or a ramp of named stops for additive) |
| `reference` | The game's sprite to measure and draw beside it (read from the game folders, never copied) |

Layer kinds (each a function of pixel and phase, all procedural, all from 5.1 to 5.3):

| kind | fields | makes |
| --- | --- | --- |
| `glow` | `radius`, `core`, `falloff`, `colour` | a halo, a lamp's glare, a laser dot |
| `flare` | `streaks: [{ angle, length, width }]`, `core` | a lens flare, a star |
| `fire` | `ramp`, `width`, `rise`, `turbulence`, `flicker` | a flame (periodic in time and scroll) |
| `smoke` | `density`, `rise`, `spread`, `curl`, `solver: "noise" \| "fluid"` | a plume or a puff (curl noise, or Stam's solver) |
| `explosion` | `ramp`, `growth`, `burn`, `cool`, `smoke` | a fireball that grows, burns out from the edge, cools |
| `sparks` | `count`, `speed`, `gravity`, `trail`, `life`, `colour` | ballistic streaks, a spray, embers |
| `ring` | `from`, `to`, `width`, `colour` | a shockwave, a portal ring |
| `beam` | `core`, `noise`, `colour` | a tiling cross-section strip |
| `picture` | `frames: [png files]` or `sheet: { file, cols, rows }` | frames made elsewhere (a person's art, an image model's output), quantised and checked like the rest |
| `shape` | `svg-like path list`, `fill`, `stroke` | a HUD icon, a crosshair |

### 8.2 The builder

`src/sprite/` (new), named in the kit's style:

1. `spr.mjs`: `writeSpr({ type, format, palette, frames, groups, sync })`; the header constants shared with
   `readSpr`, which gains the fields it skips today.
2. `palette.mjs`: shared quantising per format (5.5), on top of `indexed`.
3. `effects.mjs`: the layer kinds; periodic noise; the envelope.
4. `measure.mjs`: the measures of 6.1; `classes.mjs` the Half-Life ranges, measured from the game's files
   by a script in `research/` as `sound-classes.mjs` is.
5. `draw.mjs`: the contact sheet (each frame over dark and over grey, as the engine blends; the reference
   under it), and an APNG for the person (acTL/fcTL/fdAT chunks on top of the kit's `png`).
6. `src/spec/sprite.mjs`: `validateSpriteSpec`, `buildSpriteSpec(spec, { games }) -> { report, files,
   picture }`, as `src/spec/sound.mjs`.

Report facts: size, frames, format, colours used, quantisation error, envelope, wrap ratio, jitter,
border, dark share, and with a `class`, each one against the kind's range in words with which way to go
("border mean 0.057 (0 to 0.028): light at the edge: fade more"). FAULTs: a size the engine refuses or
shrinks, a palette that is not 256, an additive frame whose darkest colour is not black, a loop whose wrap
ratio is over 2.5, a one-shot that does not end dark, a lit border on anything but a beam, a file that does
not read back the same.

### 8.3 In a map spec

A `sprites` field beside `sounds`:

```json
"sprites": [
  { "spec": { "file": "torch_flame.json" }, "room": "hall", "at": "against north", "z": 64,
    "as": "sprite", "mode": "additive", "amount": 200, "scale": 0.5, "colour": [255, 200, 150] },
  { "spec": { "file": "lamp_glow.json" }, "room": "hall", "at": "centre", "z": 120, "as": "glow" }
]
```

Each is built with the map into `sprites/` beside it, and placed as `env_sprite` (`model`, `rendermode`,
`renderamt`, `rendercolor`, `scale`, `framerate` from the spec's `fps`, spawnflag 1 "Start on" unless it has
a `targetname`) or `env_glow` (Glow, with `renderfx` 14 when asked for a glow that does not grow with
distance). The keys are held against the FGD as every entity is. The map drawing already draws the first
frame of any entity sprite (`spritesOf`, `boardOf`), so the map's views show it lit and blended with no new
code. A render mode that does not suit the format (additive in Normal) is an error, by section 3.3.

### 8.4 MCP and the command line

- MCP: the existing `build` tool takes `"spec": "smak.sprite/1"` (one more branch beside the model, map and
  sound ones in `mcp/tools.mjs`), writes `work:<name>.spr`, `<name>.spec.json`, `<name>-sheet.png` and the
  APNG, and returns the report. `guide { doc: "spec" }` gains "A sprite". `info` and `render` accept a
  `.spr` (header, frames, measures; the contact sheet).
- CLI: `smak sprite-info <spr> [--json]`, `smak sprite-sheet <spr> -o s.png [--over grey]`,
  `smak sprite-make <png frames...> -o x.spr --format additive --type parallel [--loop]`.

## 9. Build list, in order

1. **Writer and round trip**: `writeSpr`, `readSpr` keeping every field, a self-test writing each type and
   format and reading it back byte for byte; a group written and read. Small, and everything else rests on
   it.
2. **Palette per format** (5.5) and `sprite-make` from PNG frames: already useful to a person with frames
   from any tool.
3. **Measures and Half-Life classes** (6.1, 6.2): the research script that measures the game's sprites by
   kind at run time from the person's game folder, as the sound classes are.
4. **Contact sheet and APNG**.
5. **Layer kinds**: glow, flare, fire, explosion, sparks, ring, beam, smoke (noise), with periodic time and
   the envelope; each checked against its class in the self-test.
6. **`smak.sprite/1`** validate and build, MCP `build` branch, the guide's section, worked prompts in
   `examples/prompts/`.
7. **Map spec `sprites`** (8.3).
8. **Later, if the pictures call for it**: Stam's solver with vorticity confinement as `solver: "fluid"`;
   decals into a `.wad`; HUD sheets with `hud.txt` lines; an optional image-model pre-step kept outside the
   kit, writing PNG frames for the `picture` layer.

## 10. What could not be verified

- **GoldSrc's own drawing.** Everything in section 3 that is not game or client code is Xash's. Not checked
  in GoldSrc: whether its GL renderer uses the file's texture format for anything beyond the palette (that
  an additive sprite in Normal mode shows a black square is Xash's behaviour and community advice, not
  read in GoldSrc's code); whether it clamps sprite textures at their edges; whether it plays frame groups;
  its software renderer.
- **Size limits in GoldSrc.** sprgen refuses over 256; the anniversary build ships 384 and 1024 wide HUD
  sprites, so the current Steam build loads them; whether an older build does is unknown. the303.org's
  guide says multiples of 16 and 512x512 at most; Half-Life's own files are multiples of 8.
- **Nothing was run in the game.** No sprite made here was seen in GoldSrc or Xash. The prototypes' pictures
  are the kit's stand-in for the engine's blend.
- **The VDC's sprite page** returned 403 to the fetcher and was not read.
- **The measures' thresholds** (wrap ratio under about 2.5, border mean under about 0.03) come from Half-Life's
  files and one experiment, not from a study of what a player notices.
- **The papers in 5.1 to 5.4** are cited from their known titles and methods; only Stam's solver, periodic
  value noise and SD-Turbo image-to-image were implemented and measured here.

## Sources

- Valve, Half-Life SDK: `utils/sprgen/spritegn.h`, `utils/sprgen/sprgen.c`, `dlls/effects.cpp`,
  `dlls/effects.h`, `dlls/ggrenade.cpp`, `cl_dll/entity.cpp`, `cl_dll/*.cpp` (`git@github.com:alliedmodders/hlsdk.git`
  `a0edb77`; `halflife-updated`).
- Xash3D FWGS: `engine/sprite.h`, `engine/common/mod_sprite.c`, `engine/client/cl_sprite.c`,
  `engine/client/cl_tent.c`, `ref/gl/gl_sprite.c`, `ref/gl/gl_beams.c`, `engine/common/imagelib/img_utils.c`,
  `img_wad.c` (`abf185e5`).
- Half-Life's `valve/sprites`, `valve/sprites/hud.txt`, `weapon_*.txt`, `valve/maps` (Steam install on this
  machine), measured only.
- [the303.org, GoldSrc sprite tutorial](https://the303.org/tutorials/gold_sprite.htm) and
  [part 5, animated sprites](https://the303.org/tutorials/gold_sprite_p5.htm).
- docs/ENGINES.md (this repo): `gl_max_size` and power-of-two resampling in GoldSrc.
- research/local-3d-generators.md (this repo): the SD-Turbo setup used in 7.3.
- K. Perlin, "An Image Synthesizer", SIGGRAPH 1985; "Improving Noise", SIGGRAPH 2002.
- K. Perlin, F. Neyret, "Flow Noise", SIGGRAPH 2001 technical sketch.
- J. Stam, "Stable Fluids", SIGGRAPH 1999; "Real-Time Fluid Dynamics for Games", GDC 2003.
- R. Fedkiw, J. Stam, H. W. Jensen, "Visual Simulation of Smoke", SIGGRAPH 2001.
- D. Nguyen, R. Fedkiw, H. W. Jensen, "Physically Based Modeling and Animation of Fire", SIGGRAPH 2002.
- R. Bridson, J. Hourihan, M. Nordenstam, "Curl-Noise for Procedural Fluid Flow", SIGGRAPH 2007.
- I. Quilez, "Domain warping", iquilezles.org/articles/warp.
- F. Sanglard, "How DOOM fire was done", 2018.
- P. Heckbert, "Color Image Quantization for Frame Buffer Display", SIGGRAPH 1982; X. Wu, "Efficient
  Statistical Computations for Optimal Color Quantization", Graphics Gems II, 1991.
- A. Sauer et al., "Adversarial Diffusion Distillation", 2023 (SD-Turbo); C. Meng et al., "SDEdit", 2021;
  Y. Guo et al., "AnimateDiff", 2023; A. Blattmann et al., "Stable Video Diffusion", 2023.
- W.-S. Lai et al., "Learning Blind Video Temporal Consistency", ECCV 2018.
