The sprite builds OK: `work:sprites/muzzleflash1.spr`, with `-sheet.png` and `-animated.png` beside it.

**What it is:** `sprites/muzzleflash1.spr`, a tempent muzzle flash, 64x64, 2 frames, parallel, additive (black is clear). The report places it as render mode 5 (Additive) at 20 fps. It is a one-shot (`loop: false`), so it plays once and doesn't wrap.

**What's in the picture:**
- A white-warm core about 10 px across, from a glow at radius 0.12 with the muzzle colour ramp (dark rim, peach middle, warm white core).
- Five feathered rays, one pointing up and leaning slightly right, two upper rays nearly level and slightly raised, two lower rays slanting down at about 230° and 310°, ending about 8 px above the bottom corners.
- Rays about 3 px at the base, tapering to points.
- A faint haze around the core, and no light at the border (the report shows border 0).

**Colours:** I set the ramp to your three values: core (1.0, 0.96, 0.88), mid-ray (0.92, 0.62, 0.36), rim (0.45, 0.28, 0.14), fading to black. There is no blue or red cast.

**Choices I made:** the ray angles are 80°, 15°, 165°, 230° and 310°, with lengths set from your edge distances. I used 0.05 ray width with taper 1.5, since wider or more tapered rays turned into a solid blob.

**Where it falls short:**
- **Frame 2 is effectively the same as frame 1.** The sprite spec has no per-frame control over ray angle or length, so I could not make frame 2 rotate a few degrees with lengths changing. The jitter you describe won't show in the game. Fixing that needs a feature in the sprite builder, not a tweak to this spec.
- **No reference to measure against.** I worked from your description only, so the colour and shape figures are not checked against the original. If you can send a picture of the original's frames, I can add it as `reference` and rebuild until the measured differences clear.
