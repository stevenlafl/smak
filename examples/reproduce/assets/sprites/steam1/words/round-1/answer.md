I built `sprites/steam1.spr` and the build says OK. All checks passed, and it's in range on all 5 of the measures for Half-Life's smoke puffs.

**What matches:**
- **Size and timing:** 32x48, 16 frames, plays once at 15 frames per second and ends fully clear.
- **Type and format:** faces the camera (parallel) and uses index alpha, so it draws as soft see-through white over grey. It's set up to be spawned as a temporary effect (the build placed it in render mode 4).
- **Colours:** white and greys only.
- **Frame 0:** a tiny white dot, low and a little left of centre.
- **Frames 1-3:** a dense opaque white puff in the lower middle that grows fast, from about 12 px to about 22 px.
- **Frames 4-7:** it swells to nearly the full 32 px width, white in the middle with grey edges, and a faint wisp rises above it.
- **Frames 12-15:** it fades out and is gone by frame 15.

**Where it falls short:**
- **Frames 8-11:** these should loosen into a tall ragged column with the broad part on top and a grey trail hanging below. Mine stay a big rounded blob that dims, with a faint wisp above and below it.
- **Late frames:** the end should shrink into a thin streaky wisp in the middle of the frame. Mine fades in place as a wide soft disc.
- **Edges:** the outline is smoother and rounder than the lumpy "cauliflower" bumps described. The turbulence setting barely changed it.

The sprite kit makes these shapes from preset effect layers, so I couldn't draw the frames by hand. I tried several ways to break the disc into a column (fading the puff faster, a stronger rising smoke layer, a glow up top). None worked, so I rolled back to the best version. Whoever judges the two side by side will probably spot frames 8-15 first.

The file is in the work folder at `sprites/steam1.spr`, with `-sheet.png` (all the frames) and `-animated.png` written beside it.
