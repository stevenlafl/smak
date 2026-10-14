# Directed video: a camera on a path, for models and maps

Research for SMAK, 2026-10-14. Steven wants shareable demo videos with a camera that moves along a path an agent
or he scripts: a model on a turntable, the six-panel sheet animated, a model playing its animations, and a
fly-through of a map that moves through its rooms. He noted Valve has camera rigging for scenes like that
("maybe reuse it, maybe not"). This file answers what the kit can already draw, how fast, what Valve's own
rigging is and whether to use it, how to encode with and without ffmpeg, and what a `smak video` command and
its spec would look like.

Abbreviations, expanded once: FPS (frames per second), GIF (Graphics Interchange Format), APNG (animated PNG),
PNG (Portable Network Graphics), LZW (Lempel-Ziv-Welch, GIF's compression), MP4 (MPEG-4 Part 14 container),
H.264 (also AVC, Advanced Video Coding), VP8 / VP9 (Google's video codecs), AV1 (AOMedia Video 1), WebM (the
Matroska-based container for VP8/VP9/AV1), MJPEG (Motion JPEG: every frame a JPEG), AVI (Audio Video
Interleave, Microsoft's old container), TGA (Truevision Targa image), BMP (Windows bitmap), WAV (RIFF wave
audio), HLTV (Half-Life TV, the spectator proxy), HLAE (Half-Life Advanced Effects, a community capture tool),
HLSDK (Half-Life Software Development Kit, the game code Valve published), MCP (Model Context Protocol), CPU
(central processor), GPU (graphics processor).

Provenance: game-code facts are read from the HLSDK at `~/Packages/hlsdk` (commit dd2c6d6, 2024-12-08) and
halflife-updated at `~/Packages/halflife-updated` (ba68aa8, 2026-06-10, the code Steven's browser build runs);
Xash3D facts from `~/Packages/xash3d-fwgs` (abf185e5, 2026-05-18). Web facts were looked up today and are
marked *(secondary)* where the source is a community page, not the vendor. Timings were measured today on this
machine (32 threads, Node 24.18.0, ffmpeg 8.0.1), with the scripts kept in `~/stignored/smak-directed-video/`
(outside the repo; they read the game's files from the Steam folder and write only to /tmp).

## 1. What the kit draws today, and how fast

Every picture the kit makes is CPU arithmetic in Node, one call one picture, so a video is a loop of calls.
Nothing in the kit is a camera path yet: each call takes one fixed camera.

| Call | Camera it takes | Notes for video |
| --- | --- | --- |
| `render(mdl, ...)` (`src/render.mjs`) | orbit by `yaw`, `pitch`, `zoom`, `target`; perspective with `dist` and `fov`; `"first"` (a v_ weapon's eye) | `frame` may fall between two frames (blended), so animation time can be continuous. Without `within` each frame is framed to its own pose, so the model would breathe in size: a video must pass one `framing(...)` for the whole shot |
| `sheet(mdl, ...)` | six fixed views, labelled | **It ignores a `within` passed in**: it computes `framing(src, [opts])` and puts that after `...opts` (render.mjs line 561). Animated, the front panel's figure measured 207 to 222 px tall across a walk, against 199 to 209 with one fixed framing. Needs a one-line change before an animated sheet is right |
| `strip(mdl, ...)` | one camera, one scale for all frames | Already the "contact sheet" of an animation |
| `lineup`, `tile`, `label` | several models side by side; text in a 3x5 bitmap font | `label` is enough for captions and titles; it is a small blocky font |
| `maps.drawMap(bsp, ...)` (`src/maps/draw.mjs`) | `from`, `to` or `yaw`/`pitch`, `fov`; textured, lit by the map's own lightmaps, sky, sprites, models | Keeps the prepared map (`sceneOf`, a WeakMap per `bsp`) between calls, so frame 2 onwards does not look for textures again. **From outside the map** (eye in solid) it draws every face, culled by facing: from above it shows the rooms with their roofs off, which is a fly-over shot for free (tried: c1a0 from 400 units above, 170 ms) |
| `maps.planOf`, `sectionOf`, `storeysOf` | flat, from above or the side | A plan is drawn once and panned or zoomed over: no need to redraw per frame |
| `maps.reachOf(bsp, { to: [n] })` | none | Gives `routes`: the walk to an entity as floor points. That is the path a walk-through camera follows (section 3) |
| `smak play` (`src/play*.mjs`) | the real engine (Xash3D in a browser, through Playwright) | Takes pictures on steps; no continuous capture today (section 2.4) |

### Measured

Scientist (`valve/models/scientist.mdl` with `scientistt.mdl`, walk), map `valve/maps/c1a0.bsp` with the
valve folder for textures. Times are per frame.

| What | Size | One thread | 16 worker threads (throughput) |
| --- | --- | --- | --- |
| Model `render`, textured, walking, orbit | 640x480 | 71 ms (first call 100 ms) | 94 frames/s |
| Model `sheet` (six panels of 256) | 768x512 | 128 ms | 47 frames/s |
| Map `drawMap`, eye at a start, turning on the spot | 640x480 | 459 ms mean (352 to 640) | not run |
| Map `drawMap`, walking a route, looking ahead | 640x480 | median 167 ms, 95th percentile 511 ms (inside workers) | 49.5 frames/s (393 frames in 7.9 s) |
| Map `drawMap` from outside, above | 640x480 | 170 ms | not run |
| `planOf` (whole map) | 1024x880 | 223 ms | |
| `reachOf` (walk test) | | 904 ms once per map | |
| PNG encode (`png`) | 640x480 | 5.6 ms | |

So a 10-second clip at 30 FPS (300 frames) renders in about 3 s for a model turntable, 6 s for an animated
sheet and 6 to 8 s for a walk through c1a0, using 16 of the 32 threads. One thread is about 20 s for a
turntable and about one minute for a map. That is fast enough to render whole shots and preview a contact sheet
of a few frames in well under a second. (A bigger map with more faces in view costs more; the 95th percentile
above shows the range inside one small map.)

The frames looked right: contact sheet of the walk through c1a0 showed corridors, a door and the control room
in the map's own light; the animated sheet showed the scientist walking in all six panels.

## 2. Valve's camera rigging, and recording in an engine

### 2.1 `trigger_camera` and `path_corner` (read from the HLSDK)

`trigger_camera` is a point entity in the game code (`dlls/triggers.cpp`, `CTriggerCamera`), not the engine.
When used, it calls the engine's `SET_VIEW` so the player sees from it, then each server frame:

- **Looks at** its `target` (any entity), or the player with flag 2 "Follow Player". It never looks along its
  path. It has no FOV and no roll key.
- **Turns** by a proportional controller: `avelocity = error * 40 * frametime` in the HLSDK, so how fast it
  turns depends on the frame rate (at 100 FPS it closes 40% of the error a second, at 30 FPS 133%).
  halflife-updated fixes the frame time at 0.01, so the camera closes 40% of its error a second, everywhere: a
  slow, lagging turn with a time constant of about 2.5 s.
- **Moves** in straight lines from its own origin to `moveto` (a `path_corner`), then each corner's `target`
  in turn, at `speed`, eased by `acceleration` and `deceleration` (500 units/s² each unless set). A corner's
  `speed` changes the target speed; its `wait` makes the camera slow to a stop there. A corner's `message` is
  fired on arrival (flag 1 of the corner: once). Its velocity is blended toward the target velocity by
  `2 * frametime` a frame: smoothing that also depends on the frame rate.
- **Ends** after `wait` seconds (FGD default 10) from its start, whatever the path did; then it fires its own
  targets and gives the view back. Flag 4 freezes the player; flag 1 "Start At Player" (on by default in the
  FGD) starts the camera at the player's eye.
- With no player as activator it takes entity 1: single player only in practice.

`path_track` with `func_tracktrain` (`dlls/plats.cpp`, `pathcorner.cpp`) and `func_train` carry brush
entities along corners. They cannot carry a view: the trick mappers use is an invisible `func_train` (render
mode 2, amount 0) running ahead on its own corners as the camera's `target`, so the camera seems to look where
it is going. A `scripted_sequence` makes a monster play an animation at a place; it is how a scene has actors,
not a camera.

All of these are point entities except the trains, and `smak map-set --add` already writes point entities into
a compiled map with no compile. So a fly-through for the real game is: path corners every 64 to 128 units along
the kit's own smoothed path (the camera only goes straight between corners), a `trigger_camera` with `moveto`
the first, `wait` the path's length over its speed plus a margin, `target` an `info_target` (fixed look) or an
invisible `func_train` (moving look; the train is a brush entity, so that one needs the map's source and a
compile), and a `trigger_auto` (fires at map start) targeting the camera.

**Verdict:** worth writing as an option later (`smak video --entities` writing the corners into a copy of the
.bsp), because it is the only way the shot is drawn by the game's own renderer. Not the main path: corners
give straight segments, the look always lags its target by about 2.5 s in halflife-updated, there is no FOV,
the whole shot is one `wait` long, and getting frames out still needs a recorder (2.3, 2.4).

### 2.2 HLTV's director camera paths (read from halflife-updated `cl_dll`)

The spectator HUD (`cl_dll/hud_spectator.cpp`) obeys director messages `DRC_CMD_CAMPATH` and
`DRC_CMD_WAYPOINTS` (`common/hltv.h`): up to 32 waypoints (`MAX_CAM_WAYPOINTS`), each a time, position, view
angles, FOV and flags `DRC_FLAG_SLOWSTART` / `DRC_FLAG_SLOWEND`. `cl_dll/interpolation.cpp` moves between two
waypoints on a quadratic Bézier whose middle control point comes from the neighbours' directions, eases with
`t²`, `1-(t-1)²` or a blend of both, and interpolates angles and FOV. Only a spectator with
`spec_autodirector 1` follows them. Game code can send them (`MESSAGE_BEGIN(MSG_SPEC, SVC_DIRECTOR)` is used in
`dlls/player.cpp` and `multiplay_gamerules.cpp`), and the HLTV proxy relays director messages.

**Verdict:** reuse the idea, not the code: keyframes with time, position, angles and FOV, a curve through
them, ease flags at the ends. It is the right shape for the kit's own spec (section 4). Driving it in a real
engine needs a spectator, the auto-director on and a mod that sends the messages; not worth it for demos.

### 2.3 Recording frames out of an engine

| Engine | What records | Fixed frame time | Verdict |
| --- | --- | --- | --- |
| GoldSrc (Steam Half-Life) | `startmovie <name> <fps>` writes every frame as a BMP in the game folder *(secondary: community guides; no Valve page reachable, developer.valvesoftware.com returned 403)*; whether it writes a WAV is not documented anywhere found. HLAE (Windows) writes TGA or BMP plus `sound.wav` with `mirv_movie_fps` *(secondary: sourceruns wiki)*. `record` / `playdemo` / `viewdemo` make and play `.dem` demos | `startmovie`'s fps argument (not verified) | Works for a person on Windows or Proton; not something the kit can drive headless. Not for the kit |
| Xash3D FWGS (native) | no `startmovie`; `record`, `playdemo`, `timedemo`, `screenshot`, `envshot` exist (`engine/client/cl_main.c` 3584 to 3608). AVI code is for playback (`engine/client/avi`) | `host_framerate` (seconds a frame) locks the frame time, but only in single player and not while a demo is recorded or played (`engine/common/host.c` 645) | Frames would come from a screenshot each frame; slow and unscripted. Not for the kit |
| Xash3D in the browser (`smak play`) | Playwright page screenshots (what `play` does now); Playwright's own `recordVideo` (WebM, real time); or the canvas's `captureStream` into a `MediaRecorder` (WebM, real time) | `host_framerate` 1/30 makes game time step evenly, but the browser draws in software (SwiftShader) at whatever speed it can, so real-time recorders would record stutter | The one engine path the kit could drive. See 2.4 |

### 2.4 In the browser build

Steven's browser build is xash3d-fwgs compiled to WebAssembly running halflife-updated's game code
(`~/Projects/goldsrc.net/WEBCLIENT.md`), so `trigger_camera` and `path_corner` work there as written above. The
kit's `play` already loads a map, sends console commands and takes screenshots, and `--put` writes a changed
.bsp into the running engine. A recording run would be: `--put` the map with the camera entities, `command:
host_framerate 0.0333`, load it, then screenshot in a loop. The catch is that a screenshot does not hold the
game: unless the page's main loop is paused between frames (the engine's `requestAnimationFrame` loop would
have to be stepped by hand from Playwright), screenshots land at uneven game times. That stepping is not built
and not verified.

**Verdict:** a later, optional `play` step (`{ "record": ... }`) for when the game's own look matters (its
lighting, its particle effects, a scripted scene). The kit's own renderer (section 3) is the main path:
deterministic, headless, fast, and needs no browser or game install beyond the files.

## 3. Rendering video with the kit itself

### 3.1 The camera path

| Piece | Choice | Why |
| --- | --- | --- |
| Keys | `{ t, at, look, fov }` per key, `at` and `look` points (or `yaw`/`pitch` for look) | Same as HLTV's waypoint (time, position, angles, FOV) |
| Curve through points | Centripetal Catmull-Rom (alpha 0.5) | Passes through every key, never loops or overshoots at sharp corners as uniform Catmull-Rom does (Yuksel, Schaefer and Keyser, "Parameterization and applications of Catmull-Rom curves", Computer-Aided Design 43(7), 2011, *(from memory, not re-checked)*). Tried today: 30 lines, works |
| Speed | Constant speed by arc length: sample the curve densely, accumulate length, place frames every `speed / fps` units | Without it the camera speeds up on long segments and crawls on short ones |
| Easing | Ease-in and ease-out on the arc length at a shot's ends (smoothstep, or HLTV's `t²` / `1-(t-1)²`) | A start and stop from rest |
| Look | A look-at point, a point `k` frames ahead on the same path, or a fixed target; the yaw smoothed by a moving average (15 frames each side tried) after unwrapping angles | Looking at the path's own tangent turns the view at every corner of the walk grid; looking ahead and averaging rounds it |
| Turntable and orbit | Analytic: yaw = start + 360 × t / duration; one `framing()` over every pose of the shot | No curve needed; framing once stops the model breathing |
| Walk-through | `reachOf(bsp, { to })` route → simplify (Ramer-Douglas-Peucker, 24 units) → Catmull-Rom → arc length → eye 64 above the floor (origin 36 + view 28) | The route is on the walk test's 8-unit grid and zigzags (28 points for 2089 units in c1a0); simplified to 8 it is smooth |
| Clearance | Each eye point checked with `maps.contentsAt` and pushed off walls (or the curve rejected) where it comes within ~24 units | Measured: the route hugs corners; one frame of the c1a0 walk (frame 296) had the eye inside a door frame, a full-screen smear |
| Fly-over | Eye outside the map, above, looking down 50°, orbiting the map's middle; or a plan drawn once and panned over (cheap) | `drawMap` from outside draws rooms with roofs off |
| Dolly | Two keys on a line, FOV fixed; or FOV change with distance (a "dolly zoom") | Both are keys of the same kind |

Motion blur: not worth it. It costs 4 to 8 renders a frame for a look the game itself never had; the
supersampling the renderer already does (2x2 a pixel) keeps edges clean. At 30 FPS and walking speed the
measured frame-to-frame change was smooth (3.2 below). Frame rate 30 for sharing (60 doubles render time and
size for little gain at these speeds); resolution 640x480 or 960x540 for maps, any for models; sizes must be
even for H.264.

### 3.2 First experiment, already run once

| Clip (frames from the kit) | Frames | Render | Frame-to-frame mean abs difference (0-255): median / 95th pct / max | Jumps (over 3x median) |
| --- | --- | --- | --- | --- |
| Turntable, scientist walking, 640x480 | 300 | 3.2 s, 16 workers | 2.30 / 3.44 / 6.69 | 0 |
| Animated six-panel sheet, 768x512 | 300 | 6.3 s | 3.19 / 4.22 / 4.73 | 0 |
| Walk through c1a0 along a walk-test route, 160 units/s, 640x480 | 393 (13.1 s) | 7.9 s | 9.21 / 16.12 / 52.43 | 1 (the eye inside a door frame) |
| Turning on the spot at 6° a frame | 60 | 27.5 s, 1 thread | 19.06 / 22.77 / 23.34 | 0 (but 6° a frame is too fast to watch) |

The metric works: it found the one bad frame of the walk and nothing else. It also gives a turn rate to aim
for: turning at 6° a frame doubles the walk's median change.

## 4. Encoding

### 4.1 Measured sizes

Same frames as 3.2, encoded today. "10 s" scales to 300 frames for the 13.1-second walk.

| Format | Encoder | Walk through c1a0 (13.1 s) | ≈ 10 s | Turntable 10 s | Six-panel sheet 10 s | Time (walk) |
| --- | --- | --- | --- | --- | --- | --- |
| MP4, H.264, CRF 23 | ffmpeg libx264 | 3.57 MB | 2.7 MB | 0.35 MB | 0.83 MB | 1.2 s |
| WebM, VP9, CRF 33 | ffmpeg libvpx-vp9 | 3.77 MB | 2.9 MB | 0.47 MB | 1.12 MB | 22 s |
| MP4, AV1, CRF 35 | ffmpeg libaom | 3.93 MB | 3.0 MB | | | 33 s |
| GIF, 15 FPS, 480 wide, Bayer dither | ffmpeg palettegen | 23.6 MB | 18 MB | 3.5 MB (640 wide) | 7.7 MB (768 wide) | 3.6 s |
| GIF, 30 FPS, 640 wide | ffmpeg palettegen | 74.9 MB | 57 MB | | | 4.9 s |
| GIF, 30 FPS, 640 wide, per-frame palette, no dither | **plain JS, written today** (the kit's `indexed` quantiser + a 40-line LZW) | 60.3 MB | 46 MB | 5.8 MB | 12.4 MB | 44 ms a frame |
| APNG, lossless | ffmpeg | 140.8 MB | 107 MB | 13.7 MB | 32.6 MB | 174 s |
| MJPEG in AVI, q 4 | ffmpeg | 18.5 MB | 14 MB | | | 0.3 s |

(The quality settings are each codec's usual default, not matched to equal quality, and the video files were
not compared by eye; AV1 here was run at a fast setting.)

What this says: a map walk is only shareable as video. Every frame of a moving camera changes every pixel, so
GIF and APNG cannot reuse anything between frames; 10 seconds is 18 to 107 MB. A turntable on a plain
background is fine as GIF (3.5 to 5.8 MB), and would be smaller still with one global palette and only the
changed rectangle of each frame written (ffmpeg's `diff_mode=rectangle` did that for the 3.5 MB one).

### 4.2 Writing encoders in plain JS

| Format | Effort | Verdict |
| --- | --- | --- |
| GIF | Done today in about 40 lines plus the kit's quantiser; valid (ffprobe reads 393 frames at 640x480; frame 200 decoded by ffmpeg looked right). Adding a global palette, changed-rectangle frames and ordered dithering is another 100 lines | **Build.** The no-ffmpeg fallback; right for turntables, sheets and short animations |
| APNG | The kit writes PNG already; APNG adds `acTL`, `fcTL`, `fdAT` chunks and changed-rectangle frames | Build only if lossless matters; too large for anything moving the camera |
| MJPEG in AVI | A baseline JPEG encoder (a few hundred lines) and a RIFF writer | **Skip.** No browser, Slack, Discord or GitHub plays AVI inline |
| WebM with VP8 | A VP8 keyframe-only encoder (boolean coder, transforms, intra prediction) is 1500 to 2500 lines and gives MJPEG-like sizes; inter frames with motion search are a project of their own | **Skip.** ffmpeg is on the machine and on any machine that makes videos |
| H.264, AV1 | | Out of reach in plain JS; Node has no WebCodecs |

**ffmpeg, when present:** feed raw frames on its standard input (`-f rawvideo -pix_fmt rgba -s WxH -r 30 -i -`),
so no PNG files are written: `-c:v libx264 -crf 23 -pix_fmt yuv420p -movflags +faststart`. That is the default
output. When ffmpeg is missing, write a GIF and say so.

### 4.3 Where each plays inline

| Where | Plays inline | Limit | Source |
| --- | --- | --- | --- |
| Browsers | MP4 (H.264), WebM (VP8, VP9, AV1), GIF, APNG; not AVI | | *(from memory, not re-checked)* |
| GitHub issues, PRs, discussions | MP4, MOV, WebM uploaded in the editor (H.264 recommended); GIF up to 10 MB | video 10 MB on free plans, 100 MB on paid | [docs.github.com, attaching files](https://docs.github.com/en/github/managing-your-work-on-github/file-attachments-on-issues-and-pull-requests) |
| GitHub README | GIF and APNG committed and shown with an image tag; a video only as an uploaded attachment's link, not a committed file *(the docs do not cover READMEs; not verified)* | | |
| Slack | MP4 and MOV in its player; GIF animates; WebM not confirmed | | [Slack Engineering](https://slack.engineering/what-matters-to-you-matters-to-us) *(old post)* |
| Discord | MP4 and WebM play, GIF animates *(from memory)* | 20 MB free since 2026-08-14 (was 10 MB from 2024-09) | *(secondary: news reports, e.g. [Dexerto](https://www.dexerto.com/entertainment/discord-raises-free-upload-limit-to-20mb-after-lowering-it-two-years-ago-3398251/))* |

So: MP4 H.264 for everything, under 10 MB (a 10-second map walk is 2.7 MB), plus a GIF of the turntable for a
README.

## 5. Design: `smak video` and a shot list

### 5.1 The spec

A small JSON, `smak.video/1`, beside `smak.model/1`, `smak.map/1` and `smak.sound/1`. Shots run one after
another; each has a kind, its parameters and a duration. Times in seconds, places in units, angles in degrees,
as everywhere in the kit.

```json
{
  "spec": "smak.video/1",
  "name": "scientist-and-lab",
  "size": [960, 540], "fps": 30,
  "out": ["mp4", "gif"],
  "shots": [
    { "kind": "title", "seconds": 2, "text": "SCIENTIST.MDL" },
    { "kind": "turntable", "model": "scientist.mdl", "seconds": 6, "seq": "walk", "pitch": 10,
      "turns": 1, "from": 20, "caption": "walk, 17 frames at 20 fps" },
    { "kind": "sheet", "model": "scientist.mdl", "seconds": 4, "seq": "walk" },
    { "kind": "animations", "model": "scientist.mdl", "seqs": ["idle", "walk", "run"], "each": 3,
      "view": "side", "ground": true },
    { "kind": "walk", "map": "c1a0.bsp", "from": "info_player_start", "to": "monster_sitting_scientist",
      "speed": 160, "look": "ahead", "clearance": 24, "caption": "the walk test's route, smoothed" },
    { "kind": "flyover", "map": "c1a0.bsp", "seconds": 8, "height": 400, "pitch": -50, "turns": 0.5 },
    { "kind": "path", "map": "c1a0.bsp", "keys": [
        { "t": 0, "at": [484, 318, -112], "look": [0, 300, -150], "fov": 90 },
        { "t": 4, "at": [-600, 300, -150], "look": "ahead" },
        { "t": 7, "at": [-900, 0, -170], "look": [-1000, 250, -180], "fov": 70, "ease": "out" } ] }
  ]
}
```

| Kind | Draws with | Parameters |
| --- | --- | --- |
| `title` | `label` on a plain picture | `text`, `seconds` |
| `turntable` | `render`, one `framing` over the shot's poses | `seq` (animated) or `frame`, `turns`, `from`, `pitch`, `zoom`, `body`, `skin` |
| `orbit` | `render` with `dist`, `fov` | as turntable plus `dist`, `pitch` from and to |
| `sheet` | `sheet` (once it honours `within`) | `seq`, `size`; the six panels move together |
| `animations` | `render`, one camera | `seqs`, `each` (seconds each, or the animation's own length), `view` |
| `dolly` | `render` or `drawMap` | `from`, `to`, `look`, `fov` from and to |
| `walk` | `reachOf` route, `drawMap` | `from`, `to` (entities), `speed`, `eye` (64), `look` (`"ahead"`, a point, an entity), `clearance` |
| `flyover` | `drawMap` from outside, or a plan panned | `height`, `pitch`, `turns`; `plan: true` pans the plan instead |
| `path` | `render` or `drawMap` | `keys`: `t`, `at`, `look` (point, `"ahead"`, entity), `fov`, `ease` (`in`, `out`, `both`) |

Every shot takes `caption` (bottom line), `seconds` where its length is not given by its path, and the map
drawing options it passes on (`folders`, `models`, `light`, `brightness`). Between shots: a cut; a `fade` of
half a second can come later.

### 5.2 The command

```
smak video spec.json -o out/                      every shot, encoded (mp4 with ffmpeg, gif without)
smak video spec.json -o out/ --preview            a contact sheet: 4 frames a shot, labelled with shot and time
smak video spec.json -o out/ --shot walk --frames 120-180   part of one shot, as PNGs
smak video spec.json --workers 16 --format gif    workers default to half the threads (the box runs games too)
```

It prints, per shot, the frames, render time, and the smoothness line from 3.2 (median and max frame change,
the frames that jump, and for map shots the frames whose eye is in solid or nearer a wall than `clearance`).
A jump fails the shot the way `check` fails a model: the agent fixes the path before it is shared.

### 5.3 The MCP tool

One tool, `video`, with `spec` (object or file) and `preview` (default true). Preview returns the contact sheet
as an image plus the per-shot report text, in a second or two; `preview: false` renders and encodes the whole,
returns the file names, sizes and the report, and the contact sheet again. The agent loop is the kit's own:
write the spec, preview, look, fix keys, render. Long renders run past an MCP call's time only if the server
returns before the encode finishes; at the measured speeds a 30-second video is under half a minute, so a
plain call is enough for now.

### 5.4 Writing the camera into the game instead

`smak video spec.json --entities out.bsp` (later): turns a `walk` or `path` shot into `path_corner`s every
96 units, a `trigger_camera`, an `info_target` for a fixed look and a `trigger_auto`, written with the same code
as `map-set --add`. For Steven to watch in the game, or to record through `play` once 2.4 is solved.

## 6. Prioritised build list

1. `sheet` honours a passed `within` (render.mjs line 561: put `opts.within ?? framing(...)`). Without it every
   animated sheet breathes.
2. `src/camera.mjs`: centripetal Catmull-Rom, arc-length sampling, ease, look-ahead with smoothed yaw,
   Ramer-Douglas-Peucker for routes. Tests that a constant-speed path gives equal steps.
3. `src/video.mjs`: shots to frames with worker threads; the smoothness metric and the eye clearance check
   (`contentsAt` and distance to the nearest wall) per frame; the contact sheet with `tile` and `label`.
4. Encoders: ffmpeg through standard input when found (MP4 H.264, optional WebM); a plain-JS GIF writer with
   global palette, changed rectangles and ordered dither when not.
5. `smak video` command, `smak.video/1` in `docs/SPEC.md`, the MCP `video` tool, a worked case in
   `examples/prompts/` (turntable plus a map walk), and a selftest that renders 10 frames of each shot kind.
6. Later: `--entities` (2.1), a `play` recording step (2.4), fades, a soundtrack from the kit's sound module
   muxed by ffmpeg (footsteps on a walk), APNG.

## 7. What I could not verify

- GoldSrc's `startmovie`: BMP frames come from community guides; no Valve page loaded (developer.valvesoftware.com
  and twhl.info answered 403 today). Whether it writes a WAV, and whether its fps argument fixes the frame time,
  is unconfirmed.
- Whether any public tool sends HLTV `DRC_CMD_WAYPOINTS` to spectators, and whether a spectator client honours
  them in practice; only the client code was read.
- Recording from the browser build: stepping the engine's frame loop from Playwright, and the quality of
  Playwright's `recordVideo`, were not tried.
- Inline playback of WebM in Slack, of video in a GitHub README, and of APNG in Slack and Discord; Discord's
  20 MB limit comes from news reports.
- The walk-through was tried on one small map (c1a0) and one route; a map with stairs, ladders or long open
  areas was not. The clearance push was designed from the one bad frame, not built.
- Render times on a large map (many faces in view) and the speed of `drawMap` with `models: true` were not
  measured.
