The sprite is built and written to `work:sprites/fire.spr`. The build says "OK: built, and every check passed", but it still prints two warnings, so it is not as close to the original as I'd like.

**What it is:** a flame on its base, 32x96 pixels, 15 frames, a loop that wraps back to its first frame. It is an `env_sprite`, type `parallel oriented`, format `additive` (black is clear), render mode 5, 10 frames a second. The colours follow the original's own colour at each brightness, from dark red-brown to orange-cream.

**How it was made:** one fire layer, `ramp: "reference"`, `tongues: 0.5`, `width: 1.5`, `height: 2.4`, `taper: 0.3`, with `mask: "reference"`, so its outline follows the original's lit area frame by frame. The spec is saved as `sprites_fire.spec.json` in the work folder.

**Measured against the original:**

| Measure | Original | Mine | Bar |
| --- | --- | --- | --- |
| Mean colour (delta E) | reference | 7 | 15 or under |
| Share that is dark | 0.38 | 0.46 | within 0.05 |
| Border light (brightest) | 0.275 | 0.248 | within 0.08 |
| Frames | 15 | 15 | match |
| Hot middle (pixels over 0.7) | 0 | 0 | match |
| Shape overlap (mean) | 1.00 | 0.63 | 0.8 |

**Still open:**
- **Shape, frames 9 to 12:** the original's bright core sits mid-flame, while mine sits low, near the base. The mask fixes the outline but not where the light falls inside it. I tried more tongues, extra glow layers, `rise` and `gain`. The glow layers and extra gain each made colour or hot middle worse, and `rise` changed nothing. I stopped at the best of those.
- **Dark share:** 0.46 against 0.38, slightly too much dark.

I could not read the smak source to see what `rise` and `width` are in, so I tuned them by the reported numbers only. Getting the shape bar to 0.8 probably needs a change to how the fire layer places its core, which is beyond what the spec exposes.
